const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Standard CRUD Routes matching Frontend
// Disabled Auth for restoration stability

router.get('/', studentController.getAllStudents);
router.post('/', studentController.createStudent);
router.get('/:id', studentController.getStudent);
router.put('/:id', studentController.updateStudent); // App.js uses PUT or PATCH? Investigated -> App.js uses updateStudent which likely uses PUT logic but api.js uses PUT. Controller had PATCH. Let's support both or just mapped one. api.js uses PUT.
router.patch('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;