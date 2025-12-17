const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Student = require('../src/models/Student');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Student.deleteMany({});
});

describe('Student CRUD Operations', () => {
    const validStudent = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        course: 'Computer Science',
        status: 'Active',
        gpa: 3.5,
        city: 'New York',
        country: 'USA'
    };

    describe('POST /api/v1/students', () => {
        it('should create a new student with valid data', async () => {
            const res = await request(app)
                .post('/api/v1/students')
                .send(validStudent);

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe(validStudent.name);
            expect(res.body.email).toBe(validStudent.email);
            expect(res.body._id).toBeDefined();

            const savedStudent = await Student.findById(res.body._id);
            expect(savedStudent).toBeTruthy();
        });

        it('should fail if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/students')
                .send({ name: 'Incomplete' }); // Missing email

            expect(res.statusCode).toBe(400);
        });

        it('should fail if email is duplicate', async () => {
            await Student.create(validStudent);
            const res = await request(app)
                .post('/api/v1/students')
                .send(validStudent);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/duplicate/i);
        });

        // Enterprise Field Check
        it('should accept enterprise fields', async () => {
            const enterpriseStudent = {
                ...validStudent,
                email: 'jane@enterprise.com',
                bloodGroup: 'O+',
                transportMode: 'Bus'
            };

            const res = await request(app)
                .post('/api/v1/students')
                .send(enterpriseStudent);

            expect(res.statusCode).toBe(201);
            expect(res.body.bloodGroup).toBe('O+');
            expect(res.body.transportMode).toBe('Bus');
        });
    });

    describe('PUT /api/v1/students/:id', () => {
        let studentId;

        beforeEach(async () => {
            const student = await Student.create(validStudent);
            studentId = student._id;
        });

        it('should update student details', async () => {
            const updates = { name: 'John Updated', status: 'Graduated' };
            const res = await request(app)
                .put(`/api/v1/students/${studentId}`)
                .send(updates);

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe(updates.name);
            expect(res.body.status).toBe(updates.status);
        });

        it('should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/v1/students/${fakeId}`)
                .send({ name: 'Ghost' });

            if (res.statusCode !== 404) {
                console.error("DEBUG: 500 Error Body:", res.body);
            }

            expect(res.statusCode).toBe(404);
        });
    });
});
