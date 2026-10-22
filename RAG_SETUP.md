# Document Intelligence (local RAG) setup

The RAG API runs locally. It does not use a paid or hosted LLM or embedding API.
Use the repository `.venv` interpreter for the API, health checks, model setup, and
ingestion so the server checks the same installed packages. The current environment
uses Python 3.14; FAISS/PyTorch compatibility can vary by platform and must be
verified by importing the packages and loading/encoding with the actual local model.

## Install and configure

From the repository root, create and activate a Python 3.11 virtual environment,
then install the backend requirements:

```powershell
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If you need to create the environment first, use an installed Python version
supported by your dependency set. Do not overwrite an existing `.env`; copy
`.env.example` only when `.env` does not already exist.

Install Ollama for Windows and keep it running. In a new terminal, download the
configured local generation model:

```powershell
ollama pull llama3.2
```

If Ollama is not already running as a Windows service/application, start it with
`ollama serve`.

The default embedding model is
`sentence-transformers/all-MiniLM-L6-v2`. Check and encode the local cached model:

```powershell
& .\.venv\Scripts\python.exe -m api.setup_embedding_model
```

If the model is not cached, explicitly permit setup to download it:

```powershell
& .\.venv\Scripts\python.exe -m api.setup_embedding_model --download
```

`RAG_MODEL_CACHE_DIR` optionally selects the model cache directory. Health checks
load the model in local-only mode and run an embedding probe; imports or a configured
model name alone do not establish readiness. The default Ollama model can be
overridden with `OLLAMA_MODEL`; do not set it to an uninstalled model. If you
choose another embedding model, rebuild the index.

## Documents and indexing

Put official, authorized source documents under `data/rag/documents`. Supported
formats are PDF, TXT, Markdown, and DOCX. PDF pages are retained as page metadata.
Place documents in subfolders if useful; paths remain relative to this directory.
Scanned/image-only PDFs need OCR before ingestion. Extracted tables retain text but
their visual layout may not be preserved.

Index the documents:

```powershell
& .\.venv\Scripts\python.exe -m api.ingest_documents
```

The command skips unchanged document sets using path identifiers and content hashes.
After adding, modifying, or removing documents, run it again. To force a rebuild:

```powershell
& .\.venv\Scripts\python.exe -m api.ingest_documents --rebuild
```

Changing the embedding model or chunk size/overlap also requires the explicit rebuild
command above:

```powershell
& .\.venv\Scripts\python.exe -m api.ingest_documents --rebuild
```

The index uses `data/rag/faiss_index` by default. A new generation is fully written
before the active pointer is atomically replaced; failed ingestion leaves the previous
generation in place. Old generations are intentionally not deleted automatically.
Do not point the API at an index from an untrusted source: LangChain FAISS reloads
its locally generated metadata store. The whole `data/rag/` tree is git-ignored.

## Datasets

The service searches the repository root and `data/cleaned` for the NHM budget,
infrastructure, and HMIS CSVs. Environment variables `NHM_BUDGET_CSV`,
`INFRASTRUCTURE_CSV`, and `HMIS_CSV` may set explicit paths. Structured queries
filter matching states and years, exclude `All India/Total` from state aggregates,
preserve missing numeric observations, and include CSV provenance. NHM expenditure
percentages are explicitly measured against central release, not total sanctioned
budget. HMIS `Reporting_Period` is preserved as source text, not converted into an
assumed observation date.

The supplied project copies were inspected: NHM budget contains 108 rows and no
missing values across its five expected columns; infrastructure contains 74 rows
with substantial missing numeric fields; HMIS contains 101,840 rows and 44,862
missing values each in `Value` and `Value_Numeric`. Numeric columns were parsed as
floating-point values by pandas. Missing infrastructure/HMIS values are not zeroed.

## Run

Start the backend from the repository root:

```powershell
& .\.venv\Scripts\python.exe -m uvicorn api.app:app --host 127.0.0.1 --port 8000
```

In another terminal, install frontend packages if necessary and start Vite:

```powershell
npm install
npm run dev
```

Configure `VITE_API_BASE_URL` in `.env` if the backend is not at
`http://localhost:8000`. CORS defaults to the two local Vite origins on port 5173.
`DATABASE_URL` is optional for Document Intelligence; the existing prediction
routes require it and return 503 when it is absent or unavailable.

## API and verification

- `GET /health`: API process health, not a RAG readiness assertion.
- `GET /api/rag/health`: embedding cache, index, Ollama connection, and configured
  model availability separately.
- `GET /api/documents`: actual indexed document metadata and chunk counts.
- `POST /api/chat`: `{ "question": "...", "session_id": null }`; returns grounded
  answer, retrieved document citations, structured-data provenance, and limitations.

For the local end-to-end check, verify `/api/rag/health` reports `ready: true`, check
that `/api/documents` lists the intended files, then ask a question whose answer is
verifiably present in one of those files. Confirm that the displayed excerpt/page is
the actual retrieved text. Ask an unrelated question and confirm the response states
that evidence is insufficient. These checks require local models and real source
documents; mocked unit tests are not proof of a live model pipeline.

## Troubleshooting

- **No index / no documents:** place approved MoHFW circulars, NHM guidelines, or
  healthcare expenditure PDFs in `data/rag/documents`, run the ingestion command
  with the `.venv` interpreter, then refresh the page. An empty index is never
  created to indicate success.
- **Ollama unavailable:** start the Ollama application/service, check
  `OLLAMA_BASE_URL`, and verify `ollama list`.
- **Configured model unavailable:** run `ollama pull llama3.2` or pull the exact
  `OLLAMA_MODEL` value from `.env`.
- **Model download fails:** note whether the failure occurred during DNS lookup,
  TLS connection, proxy negotiation, or transfer, and verify the configured
  Ollama registry/network from a terminal. If your network requires a proxy,
  configure only the HTTPS proxy approved for your environment; do not disable
  TLS verification or change firewall settings. The application does not
  download models automatically.
- **Embedding model unavailable:** run the setup command above. Use `--download`
  only when you intend to fetch model files and network access is available. Check
  `EMBEDDING_MODEL` and optional `RAG_MODEL_CACHE_DIR`; chat and health checks do
  not download model files.
- **Corrupted/incompatible index:** the active index is preserved and health reports
  the condition. Check model configuration and source documents, then explicitly run
  `python -m api.ingest_documents --rebuild`.
- **Dependency/platform issue:** confirm the API startup interpreter in its log and
  run `& .\.venv\Scripts\python.exe -m pip check`. The health endpoint imports
  dependencies in the serving process and reports its executable and Python version.
