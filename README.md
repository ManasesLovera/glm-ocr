# GLM-OCR

Next.js web UI for document OCR using [GLM-OCR](https://github.com/stephenc222/GLM-OCR) via [Ollama](https://ollama.com/). Supports text, table, and figure recognition with an optional structured extraction pipeline.

## Prerequisites

- [Ollama](https://ollama.com/) running locally (or on your network)
- Pull the GLM-OCR model:
  ```bash
  ollama pull glm-ocr:q8_0
  ```
- (Optional) For structured extraction, pull an extraction model:
  ```bash
  ollama pull gemma3:4b
  # or
  ollama pull gemma4:12b-cloud
  ```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

4. Open **Settings** (gear icon) and configure your Ollama host URL and model if they differ from defaults.

## Usage

1. **Upload an image** — drag-and-drop or click to select
2. **Choose a mode** — Text, Table, or Figure recognition
3. **(Optional) Enable structured extraction** — toggle the switch and configure custom fields
4. Click **Process** — OCR text is extracted and displayed

### Structured extraction (two-phase pipeline)

When the structured toggle is enabled, processing runs in two phases:

1. **OCR** — GLM-OCR extracts raw text from the image (shown immediately)
2. **Extraction** — A second model (gemma3:4b or gemma4:12b-cloud) parses the OCR text into structured JSON (document type, fields, tables, summary)

Configure custom extraction fields via the **Configure fields (N)** button.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Ollama Host URL | `http://192.168.1.9:11434` | Ollama server address |
| Model | `glm-ocr:q8_0` | OCR model |
| Extraction Model | `gemma3:4b` | Model used for structured field extraction |

Settings are not persisted — defaults are always used on reload.

## Features

- **Three recognition modes** — Text, Table, Figure (color-coded)
- **Structured extraction** — Two-phase pipeline (OCR → extraction model)
- **Custom fields** — Configure which fields to extract via modal
- **Dark/light theme** — Persistent toggle with no flash on reload
- **History panel** — Recent results cached with base64 image persistence (up to 50 items)
- **Result caching** — Same image + mode reuses cached result
- **Timing display** — Separate OCR and extraction durations shown

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- react-markdown + remark-gfm
- lucide-react icons
- sonner (toast notifications)

## Examples

### OCR Result + history
<img width="1903" height="983" alt="image" src="https://github.com/user-attachments/assets/c159381d-be8f-428c-9067-d4cf680cf981" />

### Configuring structured output fields
<img width="1213" height="890" alt="image" src="https://github.com/user-attachments/assets/056906ed-66b1-46b2-8e78-c339da44b09c" />

### Updating setting values for ollama host url, model selection for extraction, test ollama connection
<img width="521" height="576" alt="image" src="https://github.com/user-attachments/assets/f354b813-d71f-42e8-82be-1ff7d1b449fe" />

### Light mode
<img width="1891" height="903" alt="image" src="https://github.com/user-attachments/assets/4e6fa2bb-aa28-4408-9831-98f66abb6470" />



