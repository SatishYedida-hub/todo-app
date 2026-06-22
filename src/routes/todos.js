const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * @swagger
 * /todos:
 *   post:
 *     summary: Create a todo
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Buy groceries
 *               completed:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Todo created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Unauthorized
 */
router.post('/todos', auth, async (req, res) => {
  const { title, completed = false } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = await pool.query(
    'INSERT INTO todos (user_id, title, completed) VALUES ($1, $2, $3) RETURNING *',
    [req.user.id, title, completed]
  );

  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /todos:
 *   get:
 *     summary: List todos for the authenticated user
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Unauthorized
 */
router.get('/todos', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM todos WHERE user_id = $1 ORDER BY id',
    [req.user.id]
  );
  res.json(result.rows);
});

/**
 * @swagger
 * /todos/{id}:
 *   put:
 *     summary: Update a todo
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Todo updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       404:
 *         description: Todo not found
 *       401:
 *         description: Unauthorized
 */
router.put('/todos/:id', auth, async (req, res) => {
  const { title, completed } = req.body;
  const { id } = req.params;

  const result = await pool.query(
    `UPDATE todos SET
       title = COALESCE($1, title),
       completed = COALESCE($2, completed)
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [title, completed, id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(result.rows[0]);
});

/**
 * @swagger
 * /todos/{id}:
 *   delete:
 *     summary: Delete a todo
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Todo deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Todo deleted
 *       404:
 *         description: Todo not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/todos/:id', auth, async (req, res) => {
  const result = await pool.query(
    'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json({ message: 'Todo deleted' });
});

module.exports = router;
