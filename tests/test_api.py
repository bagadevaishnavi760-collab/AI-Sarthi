import platform
import sys
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from api.app import app
from api.ollama_client import OllamaModelMissing
from api.rag_service import ModelUnavailable


class DocumentIntelligenceAPITests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_startup_logs_active_python_runtime(self):
        with self.assertLogs("uvicorn.error", level="INFO") as logs:
            with TestClient(app):
                pass

        message = "\n".join(logs.output)
        self.assertIn(sys.executable, message)
        self.assertIn(platform.python_version(), message)

    def test_api_and_rag_health_are_distinct(self):
        self.assertEqual(self.client.get("/health").json()["status"], "healthy")
        with patch("api.app.RAGService.health", return_value={
            "api_available": True,
            "ready": False,
            "index_available": False,
            "components": {
                "python_dependencies": {"status": "ready", "missing_modules": []},
                "embedding_model": {"status": "loaded"},
                "faiss_index": {"status": "missing", "document_count": 0, "chunk_count": 0},
            },
        }):
            result = self.client.get("/api/rag/health").json()
        self.assertTrue(result["api_available"])
        self.assertFalse(result["ready"])
        self.assertFalse(result["index_available"])
        self.assertEqual(result["components"]["python_dependencies"]["status"], "ready")
        self.assertEqual(result["components"]["embedding_model"]["status"], "loaded")
        self.assertEqual(result["components"]["faiss_index"]["status"], "missing")

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
        }):
            self.assertEqual(self.client.post("/api/recommend", json={
                **request, "state": "Unsupported",
            }).status_code, 422)
            self.assertEqual(self.client.post("/api/recommend", json={
                **request, "year": "2022-25",
            }).status_code, 422)

        with patch("api.app.RecommendationService.options", return_value={
            "states": ["Bihar"],
            "state_years": {"Bihar": ["2022-23"]},
            "sources": [],
        }), patch("api.app.RecommendationService.generate", return_value={
            "priorityClassification": "Infrastructure",
            "selectedState": "Bihar",
            "financialYear": "2022-23",
            "executiveSummary": "Review verified capacity records.",
            "recommendedActions": ["Review capacity.", "Validate records.", "Collect missing data."],
            "suggestedAllocationFocus": [],
            "supportingReasoning": "Evidence is limited.",
            "mode": "local-ollama",
            "facts": [{"metric": "PHCs", "value": 20}],
            "calculations": [],
            "dataSources": [{"filename": "infrastructure.csv"}],
            "assumptionsAndLimitations": ["Missing values remain missing."],
            "status": "generated",
        }) as generate:
            response = self.client.post("/api/recommend", json=request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "generated")
        self.assertEqual(response.json()["facts"][0]["value"], 20)
        generate.assert_called_once_with("Bihar", "2022-23", "Infrastructure")

    def test_recommendation_normalizes_state_year_and_priority(self):
        with patch("api.app.RecommendationService.options", return_value={
            "states": ["Bihar"],
            "state_years": {"Bihar": ["2022-23"]},
            "sources": [],
        }), patch("api.app.RecommendationService.generate", return_value={
            "priorityClassification": "Primary Healthcare",
            "selectedState": "Bihar",
            "financialYear": "2022-23",
            "executiveSummary": "Review verified records.",
            "recommendedActions": ["Review capacity.", "Validate records.", "Collect missing data."],
            "suggestedAllocationFocus": [],
            "supportingReasoning": "Evidence is limited.",
            "facts": [],
            "calculations": [],
            "dataSources": [],
            "assumptionsAndLimitations": [],
            "mode": "local-ollama",
            "status": "generated",
        }) as generate:
            response = self.client.post("/api/recommend", json={
                "state": " bihar ",
                "year": "2022/2023",
                "priority": "primary healthcare",
            })

        self.assertEqual(response.status_code, 200)
        generate.assert_called_once_with("Bihar", "2022-23", "Primary Healthcare")

    def test_invalid_model_output_returns_error_without_fake_recommendation(self):
        with patch("api.app.RecommendationService.options", return_value={
            "states": ["Bihar"],
            "state_years": {"Bihar": ["2022-23"]},
            "sources": [],
        }), patch(
            "api.app.RecommendationService.generate",
            side_effect=ValueError("The local model could not produce a valid response after one retry."),
        ):
            response = self.client.post("/api/recommend", json={
                "state": "Bihar", "year": "2022-23", "priority": "Primary Healthcare",
            })

        self.assertEqual(response.status_code, 502)
        self.assertEqual(
            response.json()["detail"],
            "The local model could not produce a valid response after one retry.",
        )
        self.assertNotIn("recommendedActions", response.json())

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
