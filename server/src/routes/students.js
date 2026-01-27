const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const ensureLibraryRole = require('../middleware/rbac');

// Standard CRUD Routes matching Frontend
router.get('/', studentController.getAllStudents);
router.post('/', ensureLibraryRole(['ADMIN']), studentController.createStudent);
router.get('/:id', studentController.getStudent);
router.put('/:id', ensureLibraryRole(['ADMIN']), studentController.updateStudent);
router.patch('/:id', ensureLibraryRole(['ADMIN']), studentController.updateStudent);
router.delete('/:id', ensureLibraryRole(['ADMIN']), studentController.deleteStudent);

module.exports = router;