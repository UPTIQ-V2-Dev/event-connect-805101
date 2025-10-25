import { JSONRPC_INTERNAL_ERROR, JSONRPC_INVALID_REQUEST } from "../constants/jsonrpc.constants.js";
import { registerMCPTools } from "../services/mcp.service.js";
import { attendeeTools } from "../tools/attendee.tool.js";
import { dashboardTools } from "../tools/dashboard.tool.js";
import { eventTools } from "../tools/event.tool.js";
import { messageTools } from "../tools/message.tool.js";
import { messageTemplateTools } from "../tools/messageTemplate.tool.js";
import { userTools } from "../tools/user.tool.js";
import catchAsync from "../utils/catchAsync.js";
import { Server } from '@modelcontextprotocol/sdk/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { v4 as uuid } from 'uuid';
// Map to store transports by session ID
const transports = {};
export const mcpPostController = catchAsync(async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    let transport;
    if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
    }
    else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => uuid(),
            onsessioninitialized: newSessionId => {
                console.log('New MCP session initialized:', newSessionId);
                transports[newSessionId] = transport;
            }
        });
        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
            }
        };
        const server = new Server({
            name: 'app-builder-mcp-server',
            title: 'App Builder MCP Server',
            version: '1.0.0'
        }, {
            capabilities: {
                logging: {},
                tools: {}
            }
        });
        registerMCPTools({
            server,
            tools: [
                ...userTools,
                ...dashboardTools,
                ...eventTools,
                ...attendeeTools,
                ...messageTools,
                ...messageTemplateTools
            ]
        });
        await server.connect(transport);
    }
    else {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: JSONRPC_INVALID_REQUEST,
                message: 'Invalid Request: No valid session ID provided'
            },
            id: req.body?.id || null
        });
        return;
    }
    await transport.handleRequest(req, res, req.body);
});
export const mcpGetController = catchAsync(async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: JSONRPC_INVALID_REQUEST,
                message: 'Invalid Request: Invalid or missing session ID'
            },
            id: null
        });
        return;
    }
    try {
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
    }
    catch (error) {
        res.status(500).json({
            jsonrpc: '2.0',
            error: {
                code: JSONRPC_INTERNAL_ERROR,
                message: 'Internal error',
                data: { details: error.message }
            },
            id: null
        });
    }
});
export const mcpDeleteController = catchAsync(async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: JSONRPC_INVALID_REQUEST,
                message: 'Invalid Request: Invalid or missing session ID'
            },
            id: null
        });
        return;
    }
    try {
        const transport = transports[sessionId];
        // Handle the delete request through transport first
        await transport.handleRequest(req, res);
        // Clean up the session after successful deletion
        if (transport.sessionId) {
            delete transports[transport.sessionId];
        }
    }
    catch (error) {
        res.status(500).json({
            jsonrpc: '2.0',
            error: {
                code: JSONRPC_INTERNAL_ERROR,
                message: 'Internal error',
                data: { details: error.message }
            },
            id: null
        });
    }
});
