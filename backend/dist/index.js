"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const ws_1 = require("ws");
const auth_1 = __importDefault(require("./routes/auth"));
const customers_1 = __importDefault(require("./routes/customers"));
const churn_1 = __importDefault(require("./routes/churn"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const interventions_1 = __importDefault(require("./routes/interventions"));
const auth_2 = require("./middleware/auth");
const database_1 = require("./services/database");
const websocket_1 = require("./services/websocket");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
(0, database_1.initializeDatabase)();
app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_1.default);
app.use('/api/customers', auth_2.authenticateToken, customers_1.default);
app.use('/api/churn', auth_2.authenticateToken, churn_1.default);
app.use('/api/analytics', auth_2.authenticateToken, analytics_1.default);
app.use('/api/interventions', auth_2.authenticateToken, interventions_1.default);
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
(0, websocket_1.setupWebSocket)(wss);
server.listen(PORT, () => {
    console.log(`🚀 ChurnGuard AI Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
});
exports.default = app;
//# sourceMappingURL=index.js.map