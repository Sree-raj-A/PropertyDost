# PropertyDost

**PropertyDost is an AI powered lead manager for real-estate clients**

In this project, I have implemented a web app that organises leads in Kanban boards for better visualisation. I have taken inspiration from some popular CRMs, as well as from traditional software like G-mail. It is implemented using React and Typescrpit with the Next.JS framework.

## Live Demo

The web app is hosted live on Vercel:

https://property-dost.vercel.app/


---

## What I Built

The product supports the complete lead workflow from intake to follow-up:

1. **Lead intake**
   - Name
   - Location
   - Property requirement
   - Budget
   - Buying timeline
   - Free-text customer message / enquiry

2. **AI lead analysis**
   - Lead summary
   - Customer intent
   - Key requirements
   - Objections / concerns
   - Recommended next action
   - Suggested customer response
   - Lead score / urgency / priority signals

3. **Lead pipeline and prioritization**
   - Multiple saved leads
   - Stage-based pipeline
   - Search and filtering
   - Sort by recency, urgency, or proximity
   - Urgent / Warm / Cool prioritization
   - Expand/collapse stage lanes for faster scanning

4. **Deal Strategy Assistant**
   - A conversational assistant grounded in the selected lead
   - Handles salesperson questions such as:
     - "What should I emphasize on the call?"
     - "What are the strongest buying signals?"
     - "What objection should I address first?"
     - "Make the suggested response more assertive."
   - Customer-facing rewrites update the **Suggested Response** rather than turning the sales assistant chat into a customer message.

5. **Location intelligence**
   - Customer location map
   - Location-aware proximity sorting
   - Property-area heat-map visualisation for the selected lead(demonstration implemented, )

---

## Architecture Overview


```text
Lead Intake(manual input or AI scanned from screenshots or docs)
   ↓
POST and API calls
   ↓
Google Gemini 3 Flash Lite analysis
   ↓
Supabase leads table is appended
   ↓
Lead pipeline
   ↓
Lead dossier + Deal Strategy Assistant
```

For conversational follow-ups, the selected lead's context is sent to the chat API along with the salesperson's question. The response is generated from that lead context rather than from a generic chatbot prompt. There are also system prompts to make the model generate specific and concise answers.

---

## AI Model and API

### Model

- **Google Gemini API**
- **Model:** Gemini 3.5 Flash Lite

Gemini is used as the main AI component. Originally, I used Gemini 3.5 Flash, but the rate-limit on it was too low for all the proper generations required for the web app. However, Gemini 3.5 Flash Lite is more than capable for the task.

Changing the model requires simply editing a configuration file.

### How it is called

The app uses server-side Next.js API routes so that the Gemini API key is never exposed to the browser. This was a key consideration, as I am familiar with the news of several vibe-coded applications exposing their API keys publically, causing financial losses to the developer.

#### Lead analysis

```text
POST /api/analyze-lead
```

The route receives the lead's structured information and customer message, sends a constrained analysis prompt to Gemini, and converts the result into the fields displayed in the dossier, including summary, intent, requirements, objections, next action, suggested response, and scoring signals.

#### Conversational assistant

```text
POST /api/leads/:id/chat
```

The route loads the selected lead's context, combines it with the salesperson's question, calls Gemini, and returns a concise answer grounded in that lead.

Chat history can be restored when the salesperson leaves a lead and returns to it.

---

## Data Layer

**Supabase** is used as the persistence layer for saved leads and lead-related conversation history.

The lead record contains the customer inputs plus AI-enriched fields such as:

```text
name
location
property_requirement
budget
timeline
original_message
summary
intent
key_requirements
objections
recommended_next_action
suggested_response
urgency
priority
score
created_at
updated_at
```

This keeps the AI analysis attached to the lead instead of recomputing the dossier every time the inbox is opened.

---

## Key Technical Decisions

### 1. AI calls stay on the server

The browser talks to Next.js API routes rather than directly to Gemini. This keeps API credentials out of the client and gives one controlled place for prompts, validation, and error handling.

### 2. Store analysis with the lead

AI analysis is persisted with the lead. This makes the inbox fast to scan and means the salesperson can immediately see the previously generated next action and suggested response.

### 3. The assistant has two distinct jobs

The copilot separates:

- **Sales strategy:** advice for the salesperson inside the chat.
- **Customer-facing writing:** text that belongs in the Suggested Response card.

This avoids the common CRM problem where an assistant gives a customer message when the salesperson actually asked for internal deal strategy.

### 4. Local quick prompts reduce unnecessary AI calls

The quick-prompt chips are created from the selected lead's context and act as reusable starting points. They do not require an AI request merely to display them.

### 5. OpenStreetMap for embedded maps

The embedded location view uses OpenStreetMap rather than depending on a paid / restricted Google Maps browser key. The separate **Open Maps** action can still open the location in Google Maps.

### 6. Designed for scan speed

The lead list uses stage lanes, priority indicators, compact cards, filters, and sorting so a salesperson can move from "Who needs attention?" to "What should I do?" quickly.

---

## Running Locally

### Prerequisites

- Node.js environment
- npm package manager
- A Supabase project
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/Sree-raj-A/PropertyDost.git
cd PropertyDost
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` with the Supabase and Gemini credentials expected by the application. Replace the placeholder values with your private keys. These must never be publically exposed.


```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```


### 4. Start the server

```bash
npm run dev
```

Open this link in a browser:

```text
http://localhost:3000
```

---

## Database

The application requires a Supabase database containing the lead data used by the API routes.

The main table is:

```text
public.leads
```

Lead conversations are stored separately so the salesperson can return to an existing deal without losing the thread.


---

## Additional Features

### Deal Strategy Assistant

The Deal Strategy Assistant is made to focus on each customer at a time, and it "remembers" past chat as it is stored in the database.

### Location-based workflow

The main highlight of this project is the emphasis on location of the customer needs. Not only can you sort and filter requests based on proximity, the map of the region as well as a heatmap based on property values(imitation values for now) are also displayed.

---

## Known Limitations

- **AI output still needs review.** The model can infer concerns or priorities that are not explicitly stated by the customer, especially given that it is a "Flash" model with lesser reasoning.

- **Free-tier AI limits apply.** Gemini request quotas can limit repeated analysis or chat function calls during heavy usage.

- **Map is not fully precise** Since customers give a rough location, the map doesn't show the exact location of the porperty, but that of a general area.

- **This is a focused assignment build, not a production CRM.** Authentication, role management, etc are not properly implemented. There can be several issues with the software too, especially UI-related.

- **The property heat-map is a workflow visualisation, not a live market-data product.** I have only build a demostration of the heat-map, as the data and analysis required for an accurate and realistic one is beyond the scope of this assignment.

---

## AI Usage Disclosure

### AI used in the product

- **Google Gemini**, specifically the Flash-Lite version, is the engine behind the interactive model in the web app.

### AI used while building the project
I have used AI extensively for developing this project. A prototype was made using **Gemini Pro**, then more features were added using **ChatGPT**. The Supabase and Vercel integration was done by me, but I faced some errors during the deployment, where I used **ChatGPT** to debug it.


---

## Repository Structure


```text
app/
├── api/
│   ├── analyze-lead/
│   └── leads/
│       └── [id]/
│           └── chat/
├── components/
│   ├── LeadDetail.tsx
│   ├── LeadList.tsx
│   ├── LeadLocationMap.tsx
│   ├── PropertyHeatMap.tsx
│   ├── LeadActionsFAB.tsx
│   └── Sidebar.tsx
└── ...
```

---

