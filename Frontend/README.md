# SmartMSME Frontend

Modern React + TypeScript frontend for the SmartMSME business intelligence platform.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - API calls
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Features

- ✅ User authentication (login/register)
- ✅ Dashboard with KPI metrics and charts
- ✅ Multi-branch management
- ✅ Product catalog
- ✅ Sales tracking
- ✅ Income & expense management
- ✅ Reminder system
- ✅ AI business assistant
- ✅ User profile management

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
Create `.env` file:
```
VITE_API_URL=http://localhost:8000/api
```

3. **Start development server:**
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── Layout.tsx    # Main layout wrapper
│   └── PrivateRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   ├── api.ts        # Axios configuration
│   └── utils.ts      # Helper functions
├── pages/
│   ├── Dashboard.tsx
│   ├── Branches.tsx
│   ├── Products.tsx
│   ├── Sales.tsx
│   ├── Income.tsx
│   ├── Expenses.tsx
│   ├── Reminders.tsx
│   ├── AIAssistant.tsx
│   ├── Profile.tsx
│   ├── Login.tsx
│   └── Register.tsx
├── App.tsx
└── main.tsx
```

## API Integration

The frontend connects to the Django backend via proxy configuration in `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true
  }
}
```

## Authentication

- JWT tokens stored in localStorage
- Automatic token refresh on 401 errors
- Protected routes redirect to login

## Key Components

### Dashboard
- Revenue, expenses, profit metrics
- Line charts for revenue trends
- Pie charts for expense breakdown
- Bar charts for top products

### CRUD Pages
All entity pages (Branches, Products, Sales, etc.) include:
- List view with tables
- Add/Edit forms
- Delete functionality
- Error handling

### AI Assistant
- Chat interface for business queries
- Real-time responses from backend AI agent
- Natural language processing

## Styling

Uses Tailwind CSS with custom color scheme:
- Primary: Blue (#3b82f6)
- Success: Green
- Destructive: Red
- Muted: Gray tones

## Development Notes

- All API calls include error handling
- Loading states for async operations
- Responsive design for mobile/tablet/desktop
- Type-safe with TypeScript interfaces
- Consistent UI patterns across pages
