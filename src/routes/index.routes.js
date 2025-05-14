import { Router } from 'express';
const router = Router();
import blogRoutes from './blog.routes.js';

router.get('/', (req, res) => res.render('index'));
router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

// Blog routes
router.use('/blog', blogRoutes);

export default router;