// routes/taskRoutes.js   →  /api/tasks/...
const express = require('express');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema, listQuerySchema } = require('../validators/taskValidator');

const router = express.Router();

// Apply protect to EVERY route in this file (all task routes are private)
router.use(protect);

router.get('/stats', taskController.getStats); // must be above '/:id'
router.get('/', validate(listQuerySchema, 'query'), taskController.listTasks);
router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/:id', taskController.getTask);
router.patch('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
