"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_1 = require("./config/swagger");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const glucose_routes_1 = __importDefault(require("./routes/glucose.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const insulin_routes_1 = __importDefault(require("./routes/insulin.routes"));
const food_routes_1 = __importDefault(require("./routes/food.routes"));
const debug_routes_1 = __importDefault(require("./routes/debug.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.prisma = new client_1.PrismaClient({
    log: ['query', 'error', 'warn'],
});
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: true,
    maxAge: 86400,
}));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use((req, res, next) => {
    console.log('=== Request Details ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Request Path:', req.path);
    console.log('Base URL:', req.baseUrl);
    console.log('Original URL:', req.originalUrl);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    console.log('=== End Request Details ===');
    next();
});
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
app.use('/api/docs', swagger_1.swaggerUi.serve);
app.get('/api/docs', swagger_1.swaggerUi.setup(swagger_1.specs, Object.assign(Object.assign({}, swagger_1.swaggerUiOptions), { explorer: true, customCss: '.swagger-ui .topbar { display: none }' })));
app.use('/api/debug', debug_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/glucose', glucose_routes_1.default);
app.use('/api/activities', activity_routes_1.default);
app.use('/api/insulin', insulin_routes_1.default);
app.use('/api/food', food_routes_1.default);
app.get('/', (req, res) => {
    res.redirect('/api/docs');
});
app.use(error_middleware_1.notFound);
app.use((err, req, res, next) => {
    console.error('=== Error Details ===');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('URL:', req.url);
    console.error('Method:', req.method);
    console.error('Body:', req.body);
    console.error('=== End Error Details ===');
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`⚡️[server]: Server is running on port ${port}`);
        console.log('Environment:', process.env.NODE_ENV);
        console.log('Database connection established');
    });
    const shutdown = async () => {
        console.log('Shutting down gracefully...');
        await exports.prisma.$disconnect();
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
exports.default = app;
//# sourceMappingURL=app.js.map