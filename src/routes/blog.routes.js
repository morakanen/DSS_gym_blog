import { Router } from 'express';
import { prisma } from '../utils/database.js';

const router = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

// Get all blog posts with optional search
router.get('/', async (req, res) => {
  console.log('Session data:', req.session);
  try {
    const { search } = req.query;
    
    // Build the where clause for search
    const where = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    console.log('Search query:', where);
    
    // Fetch posts with author information
    const posts = await prisma.Blog.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Fetched posts:', posts.length);
    
    // Prepare data for the view
    const viewData = {
      posts,
      search: search || '',
      user: req.session.user,
      userId: req.session.userId,
      userName: req.session.user?.name || null,
      isAuthenticated: !!req.session.userId
    };

    res.render('blog/index', viewData);
  } catch (error) {
    console.error('Blog error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    res.status(500).render('error', {
      message: 'An error occurred while fetching posts',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : {}
    });
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
