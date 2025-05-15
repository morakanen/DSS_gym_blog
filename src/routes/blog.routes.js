import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

// Get all blog posts with optional search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const where = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const posts = await prisma.blog.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.render('blog/index', { 
      posts, 
      search,
      user: req.session.userId,
      userName: req.session.user?.name
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// Create new post form
router.get('/new', isAuthenticated, (req, res) => {
  res.render('blog/new');
});

// Create new post
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    await prisma.blog.create({
      data: {
        title,
        content,
        authorId: req.session.userId
      }
    });
    res.redirect('/blog');
  } catch (error) {
    res.status(500).json({ error: 'Error creating post' });
  }
});

// Edit post form
router.get('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const post = await prisma.blog.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (post.authorId !== req.session.userId) {
      return res.redirect('/blog');
    }
    res.render('blog/edit', { post });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching post' });
  }
});

// Update post
router.post('/:id', isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await prisma.blog.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (post.authorId !== req.session.userId) {
      return res.redirect('/blog');
    }
    await prisma.blog.update({
      where: { id: parseInt(req.params.id) },
      data: { title, content }
    });
    res.redirect('/blog');
  } catch (error) {
    res.status(500).json({ error: 'Error updating post' });
  }
});

// Delete post
router.post('/:id/delete', isAuthenticated, async (req, res) => {
  try {
    const post = await prisma.blog.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (post.authorId !== req.session.userId) {
      return res.redirect('/blog');
    }
    await prisma.blog.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.redirect('/blog');
  } catch (error) {
    res.status(500).json({ error: 'Error deleting post' });
  }
});

export default router;
