import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from api.app import app
from api.ollama_client import OllamaModelMissing
from api.rag_service import ModelUnavailable


class DocumentIntelligenceAPITests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_api_and_rag_health_are_distinct(self):
        self.assertEqual(self.client.get("/health").json()["status"], "healthy")
        with patch("api.app.RAGService.health", return_value={
            "api_available": True,
            "ready": False,
            "index_available": False,
        }):
            result = self.client.get("/api/rag/health").json()
        self.assertTrue(result["api_available"])
        self.assertFalse(result["ready"])
        self.assertFalse(result["index_available"])

    def test_documents_endpoint_reports_actual_empty_index(self):
        with patch("api.app.RAGService.documents", return_value=[]):
            response = self.client.get("/api/documents")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"documents": []})

    def test_chat_validates_question_and_returns_backend_response(self):
        self.assertEqual(self.client.post("/api/chat", json={"question": "  "}).status_code, 422)
        backend_result = {
            "answer": "Retrieved answer",
            "grounded": True,
            "sources": [{"document_name": "real.pdf", "page": 2, "excerpt": "real excerpt"}],
            "data_sources": [],
            "limitations": [],
        }
        with patch("api.app.RAGService.answer", return_value=backend_result):
            response = self.client.post("/api/chat", json={"question": "A valid question"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["answer"], "Retrieved answer")
        self.assertEqual(response.json()["sources"][0]["document_name"], "real.pdf")
        self.assertTrue(response.json()["session_id"])

    def test_chat_reports_local_model_unavailability(self):
        with patch("api.app.RAGService.answer", side_effect=ModelUnavailable("Ollama is offline.")):
            response = self.client.post("/api/chat", json={"question": "A valid question"})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "Ollama is offline.")

    def test_recommendation_options_returns_available_dataset_pairs(self):
        options = {
            "states": ["Bihar"],
            "state_years": {"Bihar": ["2022-23"]},
            "sources": [],
        }
        with patch("api.app.RecommendationService.options", return_value=options):
            response = self.client.get("/api/recommend/options")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state_years"]["Bihar"], ["2022-23"])

    def test_recommendation_validates_selections_and_returns_evidence(self):
        request = {"state": "Bihar", "year": "2022-23", "priority": "Infrastructure"}
        response = self.client.post("/api/recommend", json={**request, "priority": "Unsupported"})
        self.assertEqual(response.status_code, 422)

        with patch("api.app.RecommendationService.options", return_value={
            "states": ["Bihar"],
            "state_years": {"Bihar": ["2022-23"]},
            "sources": [],
        }), patch("api.app.RecommendationService.generate", return_value={
            "mode": "local-ollama",
            "facts": [{"metric": "PHCs", "value": 20}],
        }) as generate:
            response = self.client.post("/api/recommend", json=request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["facts"][0]["value"], 20)
        generate.assert_called_once_with("Bihar", "2022-23", "Infrastructure")

    def test_recommendation_rejects_unavailable_pair_and_reports_ollama_failure(self):
        with patch("api.app.RecommendationService.options", return_value={
            "states": [],
            "state_years": {},
            "sources": [],
        }):
            response = self.client.post("/api/recommend", json={
                "state": "Bihar", "year": "2022-23", "priority": "Infrastructure",
            })
        self.assertEqual(response.status_code, 422)

        with patch("api.app.RecommendationService.options", return_value={
            "states": ["Bihar"],
            "state_years": {"Bihar": ["2022-23"]},
            "sources": [],
        }), patch(
            "api.app.RecommendationService.generate",
            side_effect=OllamaModelMissing("model missing"),
        ):
            response = self.client.post("/api/recommend", json={
                "state": "Bihar", "year": "2022-23", "priority": "Infrastructure",
            })
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "model missing")

    def test_cors_allows_only_configured_local_frontend_origin(self):
        response = self.client.options(
            "/api/chat",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:5173")
        self.assertNotIn("*", response.headers["access-control-allow-origin"])


if __name__ == "__main__":
    unittest.main()
