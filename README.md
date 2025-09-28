# My Love Server

A modern Node.js API server built with TypeScript, Express, and Socket.io.

## 🚀 Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express.js** - Fast, unopinionated web framework
- **Socket.io** - Real-time bidirectional communication
- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Protection against abuse
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Winston Logger** - Structured logging
- **Swagger/OpenAPI** - API documentation
- **Docker** - Containerization
- **Testing** - Jest with coverage
- **ESLint & Prettier** - Code quality and formatting
- **Husky** - Git hooks for code quality

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-love-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:3000
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   DATABASE_URL=your-database-url
   REDIS_URL=your-redis-url
   CORS_ORIGIN=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   LOG_LEVEL=info
   API_PREFIX=/api/v1
   ```

## 🚀 Development

### Start development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

## 🧪 Testing

### Run tests
```bash
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in watch mode
```bash
npm run test:watch
```

## 🔧 Code Quality

### Lint code
```bash
npm run lint
```

### Fix linting issues
```bash
npm run lint:fix
```

### Format code
```bash
npm run format
```

### Check code formatting
```bash
npm run format:check
```

### Type checking
```bash
npm run type-check
```

## 🐳 Docker

### Build Docker image
```bash
docker build -t my-love-server .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

### Run in development mode
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## 📁 Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── config/                # Configuration files
├── features/              # Feature modules
│   ├── auth/             # Authentication feature
│   ├── users/            # Users feature
│   └── chat/             # Chat feature
├── middlewares/           # Express middlewares
├── models/               # Data models
├── routes/               # Route definitions
├── shared/               # Shared utilities
│   ├── config/           # Shared configuration
│   ├── middlewares/      # Shared middlewares
│   ├── types/            # Shared types
│   └── utils/            # Shared utilities
├── sockets/              # Socket.io handlers
├── types/                # Global types
├── utils/                # Global utilities
└── validations/          # Validation schemas
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh token

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `DELETE /api/v1/users/profile` - Delete user account

### Chat
- `GET /api/v1/chat/messages` - Get chat messages
- `POST /api/v1/chat/messages` - Send message

## 📚 API Documentation

When the server is running, you can access the API documentation at:
- Swagger UI: `http://localhost:5000/api-docs`

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Protection against brute force attacks
- **CORS** - Controlled cross-origin requests
- **Helmet** - Security headers
- **Input Validation** - Request validation
- **Error Handling** - Centralized error handling

## 📊 Monitoring & Logging

- **Winston Logger** - Structured logging with different levels
- **Morgan** - HTTP request logging
- **Error Tracking** - Centralized error handling

## 🚀 Deployment

### Environment Variables

Make sure to set the following environment variables in production:

```env
NODE_ENV=production
JWT_SECRET=your-very-secure-jwt-secret
DATABASE_URL=your-production-database-url
REDIS_URL=your-production-redis-url
```

### Docker Deployment

1. Build the image:
   ```bash
   docker build -t my-love-server .
   ```

2. Run the container:
   ```bash
   docker run -p 5000:5000 --env-file .env my-love-server
   ```

### Docker Compose Deployment

```bash
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help, please open an issue on GitHub.

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.
