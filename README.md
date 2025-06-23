![](https://github.com/xyflow/web/blob/main/assets/codesandbox-header-ts.png?raw=true)

# React Flow starter (Vite + TS)

We've put together this template to serve as a starting point for folks
interested in React Flow. You can use this both as a base for your own React
Flow applications, or for small experiments or bug reports.

**TypeScript not your thing?** We also have a vanilla JavaScript starter template,
just for you!

## Getting up and running

You can get this template without forking/cloning the repo using `degit`:

```bash
npx degit xyflow/vite-react-flow-template your-app-name
```

The template contains mostly the minimum dependencies to get up and running, but
also includes eslint and some additional rules to help you write React code that
is less likely to run into issues:

```bash
npm install # or `pnpm install` or `yarn install`
```

Vite is a great development server and build tool that we recommend our users to
use. You can start a development server with:

```bash
npm run dev
```

While the development server is running, changes you make to the code will be
automatically reflected in the browser!

## Things to try:

- Create a new custom node inside `src/nodes/` (don't forget to export it from `src/nodes/index.ts`).
- Change how things look by [overriding some of the built-in classes](https://reactflow.dev/learn/customization/theming#overriding-built-in-classes).
- Add a layouting library to [position your nodes automatically](https://reactflow.dev/learn/layouting/layouting)

## Resources

Links:

- [React Flow - Docs](https://reactflow.dev)
- [React Flow - Discord](https://discord.com/invite/Bqt6xrs)

Learn:

- [React Flow – Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)
- [React Flow – Layouting](https://reactflow.dev/learn/layouting/layouting)

# Benders Workflow Management System

A comprehensive business process management platform built with React (Vite) frontend and Node.js backend.

## 🚀 Features

- **Multi-Auth System**: Email/Password, Magic Links, Google OAuth, GitHub OAuth
- **Workflow Management**: Visual workflow builder and process automation
- **Kanban Boards**: Task management with drag-and-drop interface
- **Team Collaboration**: User management and role-based access control
- **Client Management**: CRM functionality with meeting scheduling
- **Real-time Dashboard**: Analytics and insights

## 🛠️ Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons

**Backend:**
- Node.js with Express
- SQLite database
- JWT authentication
- Google & GitHub OAuth
- Bcrypt for password hashing

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/pnpm
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd benders-workflow
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 3. Environment Setup

#### Frontend Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values:
# VITE_GOOGLE_CLIENT_ID=your-google-client-id
# VITE_GITHUB_CLIENT_ID=your-github-client-id
```

#### Backend Environment
```bash
# Copy example environment file (in server directory)
cp .env.example .env

# Edit server/.env with your values:
# JWT_SECRET=your-secure-random-string
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 4. OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:5173/oauth/callback/google`
5. Copy Client ID and Client Secret to your `.env` files

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App:
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5173/oauth/callback/github`
3. Copy Client ID and Client Secret to your `.env` files

## 🚀 Running the Application

### Development Mode
```bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start frontend development server
npm run dev
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api

### Production Build
```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

## 🔐 Authentication

The system supports multiple authentication methods:

1. **Email/Password**: Traditional login with secure password hashing
2. **Magic Links**: Passwordless login via email
3. **Google OAuth**: Single sign-on with Google account
4. **GitHub OAuth**: Single sign-on with GitHub account

### Test Accounts
When you first run the application, these test accounts are created:
- **Admin**: `admin@bendersworkflow.com` / `admin123`
- **Manager**: `manager@bendersworkflow.com` / `manager123`
- **User**: `user@bendersworkflow.com` / `user123`

## 📁 Project Structure

```
benders-workflow/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── context/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layers
│   └── types/              # TypeScript type definitions
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration files
│   └── data/               # SQLite database files
└── docs/                   # Documentation
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Controlled cross-origin requests
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries

## 🧪 API Testing

Test authentication endpoints:
```bash
# Health check
curl http://localhost:3001/health

# Login with email/password
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bendersworkflow.com","password":"admin123"}'

# Get current user (requires auth token)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 Deployment

### Environment Variables for Production
- Generate secure `JWT_SECRET` (64+ character random string)
- Update OAuth redirect URIs to production domains
- Set `NODE_ENV=production`
- Configure proper CORS origins

### Database
- SQLite database automatically initializes with required tables
- Database file stored in `server/data/benders_workflow.db`
- Automatic seeding with sample data in development

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **OAuth redirect_uri_mismatch**: Ensure redirect URIs in OAuth providers match exactly
2. **Database errors**: Delete `server/data/benders_workflow.db` to reset database
3. **Port conflicts**: Change ports in environment files if 3001/5173 are in use
4. **CORS errors**: Verify `CORS_ORIGIN` matches frontend URL

### Getting Help

- Check the [documentation](docs/)
- Review [API documentation](http://localhost:3001/api) when server is running
- Open an issue for bugs or feature requests

---

Built with ❤️ for efficient business process management
