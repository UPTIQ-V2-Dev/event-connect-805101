import { messageTemplateController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { messageTemplateValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// Authenticated routes
router
    .route('/')
    .post(
        auth('manageMessageTemplates'),
        validate(messageTemplateValidation.createMessageTemplate),
        messageTemplateController.createMessageTemplate
    )
    .get(
        auth('getMessageTemplates'),
        validate(messageTemplateValidation.getMessageTemplates),
        messageTemplateController.getMessageTemplates
    );

router
    .route('/:id')
    .get(
        auth('getMessageTemplates'),
        validate(messageTemplateValidation.getMessageTemplate),
        messageTemplateController.getMessageTemplate
    )
    .put(
        auth('manageMessageTemplates'),
        validate(messageTemplateValidation.updateMessageTemplate),
        messageTemplateController.updateMessageTemplate
    )
    .delete(
        auth('manageMessageTemplates'),
        validate(messageTemplateValidation.deleteMessageTemplate),
        messageTemplateController.deleteMessageTemplate
    );

export default router;

/**
 * @swagger
 * tags:
 *   name: MessageTemplates
 *   description: Message template management and retrieval
 */

/**
 * @swagger
 * /message-templates:
 *   post:
 *     summary: Create a message template
 *     description: Create a new message template. Requires authentication.
 *     tags: [MessageTemplates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subject
 *               - content
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *                 example: "RSVP Confirmation"
 *               subject:
 *                 type: string
 *                 description: Email subject line with optional placeholders
 *                 example: "Your RSVP for {{event.title}} has been confirmed"
 *               content:
 *                 type: string
 *                 description: Template content with optional placeholders
 *                 example: "Thank you for confirming your attendance to {{event.title}}."
 *               category:
 *                 type: string
 *                 description: Template category
 *                 example: "confirmation"
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "clxxx123456"
 *                 name:
 *                   type: string
 *                   example: "RSVP Confirmation"
 *                 subject:
 *                   type: string
 *                   example: "Your RSVP for {{event.title}} has been confirmed"
 *                 content:
 *                   type: string
 *                   example: "Thank you for confirming your attendance to {{event.title}}."
 *                 category:
 *                   type: string
 *                   example: "confirmation"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-25T10:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-25T10:00:00Z"
 *       "400":
 *         description: Bad Request
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *
 *   get:
 *     summary: Get all message templates
 *     description: Retrieve all message templates with optional filtering and search. Requires authentication.
 *     tags: [MessageTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by template name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by template category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, subject, content, or category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of templates
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "clxxx123456"
 *                   name:
 *                     type: string
 *                     example: "RSVP Confirmation"
 *                   subject:
 *                     type: string
 *                     example: "Your RSVP for {{event.title}} has been confirmed"
 *                   content:
 *                     type: string
 *                     example: "Thank you for confirming your attendance to {{event.title}}."
 *                   category:
 *                     type: string
 *                     example: "confirmation"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-25T10:00:00Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-25T10:00:00Z"
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */

/**
 * @swagger
 * /message-templates/{id}:
 *   get:
 *     summary: Get a message template
 *     description: Get a specific message template by ID. Requires authentication.
 *     tags: [MessageTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "clxxx123456"
 *                 name:
 *                   type: string
 *                   example: "RSVP Confirmation"
 *                 subject:
 *                   type: string
 *                   example: "Your RSVP for {{event.title}} has been confirmed"
 *                 content:
 *                   type: string
 *                   example: "Thank you for confirming your attendance to {{event.title}}."
 *                 category:
 *                   type: string
 *                   example: "confirmation"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-25T10:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-25T10:00:00Z"
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Template not found
 *
 *   put:
 *     summary: Update a message template
 *     description: Update an existing message template. Requires authentication.
 *     tags: [MessageTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *                 example: "Updated Template Name"
 *               subject:
 *                 type: string
 *                 description: Email subject line with optional placeholders
 *                 example: "Updated subject for {{event.title}}"
 *               content:
 *                 type: string
 *                 description: Template content with optional placeholders
 *                 example: "Updated template content for {{event.title}}."
 *               category:
 *                 type: string
 *                 description: Template category
 *                 example: "reminder"
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "clxxx123456"
 *                 name:
 *                   type: string
 *                   example: "Updated Template Name"
 *                 subject:
 *                   type: string
 *                   example: "Updated subject for {{event.title}}"
 *                 content:
 *                   type: string
 *                   example: "Updated template content for {{event.title}}."
 *                 category:
 *                   type: string
 *                   example: "reminder"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-25T10:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-25T12:00:00Z"
 *       "400":
 *         description: Bad Request
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Template not found
 *
 *   delete:
 *     summary: Delete a message template
 *     description: Delete a message template. Requires authentication.
 *     tags: [MessageTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Template not found
 */
