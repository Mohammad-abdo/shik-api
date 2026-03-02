const { prisma } = require('../lib/prisma');
const fileUploadService = require('./fileUploadService');

const HERO_SLUG = 'hero-slider';

const heroService = {
  // Get active slides for public display
  getActiveSlides: async () => {
    try {
      const heroPage = await prisma.sitePage.findUnique({
        where: { slug: HERO_SLUG }
      });

      if (!heroPage) {
        return {
          success: true,
          data: []
        };
      }

      const slidesData = JSON.parse(heroPage.body);
      const activeSlides = slidesData.slides
        .filter(slide => slide.isActive)
        .sort((a, b) => a.order - b.order);

      return {
        success: true,
        data: activeSlides
      };
    } catch (error) {
      throw error;
    }
  },

  // Get all slides for admin
  getAllSlides: async () => {
    try {
      const heroPage = await prisma.sitePage.findUnique({
        where: { slug: HERO_SLUG }
      });

      if (!heroPage) {
        return {
          success: true,
          data: []
        };
      }

      const slidesData = JSON.parse(heroPage.body);
      const sortedSlides = slidesData.slides.sort((a, b) => a.order - b.order);

      return {
        success: true,
        data: sortedSlides
      };
    } catch (error) {
      throw error;
    }
  },

  // Get single slide by ID
  getSlideById: async (id) => {
    try {
      const heroPage = await prisma.sitePage.findUnique({
        where: { slug: HERO_SLUG }
      });

      if (!heroPage) {
        throw new Error('Hero slider not found');
      }

      const slidesData = JSON.parse(heroPage.body);
      const slide = slidesData.slides.find(s => s.id === id);

      if (!slide) {
        throw new Error('Slide not found');
      }

      return {
        success: true,
        data: slide
      };
    } catch (error) {
      throw error;
    }
  },

  // Create new slide
  createSlide: async (data, file) => {
    try {
      // Handle image upload
      let imageUrl = data.image;
      if (file) {
        imageUrl = fileUploadService.uploadFile(file, 'hero');
      }

      if (!imageUrl) {
        throw new Error('Image is required');
      }

      // Get current slides
      const heroPage = await prisma.sitePage.findUnique({
        where: { slug: HERO_SLUG }
      });

      let slides = [];
      if (heroPage) {
        slides = JSON.parse(heroPage.body).slides || [];
      }

      // Generate new ID (using timestamp + random for uniqueness)
      const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Calculate order (put at the end by default)
      const order = data.order !== undefined 
        ? parseInt(data.order) 
        : slides.length;

      // Create new slide object
      const newSlide = {
        id: newId,
        image: imageUrl,
        title: data.title,
        titleAr: data.titleAr,
        description: data.description,
        descriptionAr: data.descriptionAr,
        buttonText: data.buttonText || null,
        buttonTextAr: data.buttonTextAr || null,
        buttonLink: data.buttonLink || null,
        order,
        isActive: data.isActive === 'true' || data.isActive === true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      slides.push(newSlide);

      // Update or create the page
      const updatedPage = await prisma.sitePage.upsert({
        where: { slug: HERO_SLUG },
        update: {
          body: JSON.stringify({ slides }),
          bodyAr: JSON.stringify({ slides })
        },
        create: {
          slug: HERO_SLUG,
          title: 'Hero Slider',
          titleAr: 'الشريط المتحرك',
          body: JSON.stringify({ slides: [newSlide] }),
          bodyAr: JSON.stringify({ slides: [newSlide] })
        }
      });

      return {
        success: true,
        data: newSlide,
        message: 'Slide created successfully'
      };
    } catch (error) {
      throw error;
    }
  },

  // Update existing slide
  updateSlide: async (id, data, file) => {
    try {
      // Get current slides
      const heroPage = await prisma.sitePage.findUnique({
        where: { slug: HERO_SLUG }
      });

      if (!heroPage) {
        throw new Error('Hero slider not found');
      }

      const slidesData = JSON.parse(heroPage.body);
      const slideIndex = slidesData.slides.findIndex(s => s.id === id);

      if (slideIndex === -1) {
        throw new Error('Slide not found');
      }

      // Handle image upload
      let imageUrl = slidesData.slides[slideIndex].image;
      if (file) {
        imageUrl = fileUploadService.uploadFile(file, 'hero');
      } else if (data.image && data.image !== imageUrl) {
        imageUrl = data.image;
      }

      // Update slide fields
      const updatedSlide = {
        ...slidesData.slides[slideIndex],
        ...(data.title && { title: data.title }),
        ...(data.titleAr && { titleAr: data.titleAr }),
        ...(data.description && { description: data.description }),
        ...(data.descriptionAr && { descriptionAr: data.descriptionAr }),
        ...(data.buttonText !== undefined && { buttonText: data.buttonText }),
        ...(data.buttonTextAr !== undefined && { buttonTextAr: data.buttonTextAr }),
        ...(data.buttonLink !== undefined && { buttonLink: data.buttonLink }),
        ...(data.order !== undefined && { order: parseInt(data.order) }),
        ...(data.isActive !== undefined && { isActive: data.isActive === 'true' || data.isActive === true }),
        image: imageUrl,
        updatedAt: new Date().toISOString()
      };

      slidesData.slides[slideIndex] = updatedSlide;

      // Update the page
      await prisma.sitePage.update({
        where: { slug: HERO_SLUG },
        data: {
          body: JSON.stringify(slidesData),
          bodyAr: JSON.stringify(slidesData)
        }
      });

      return {
        success: true,
        data: updatedSlide,
        message: 'Slide updated successfully'
      };
    } catch (error) {
      throw error;
    }
  },

  // Delete slide
  deleteSlide: async (id) => {
    try {
      const heroPage = await prisma.sitePage.findUnique({
        where: { slug: HERO_SLUG }
      });

      if (!heroPage) {
        throw new Error('Hero slider not found');
      }

      const slidesData = JSON.parse(heroPage.body);
      const slideToDelete = slidesData.slides.find(s => s.id === id);

      if (!slideToDelete) {
        throw new Error('Slide not found');
      }

      // Filter out the slide
      slidesData.slides = slidesData.slides.filter(s => s.id !== id);

      // Reorder remaining slides
      slidesData.slides.forEach((slide, index) => {
        slide.order = index;
      });

      await prisma.sitePage.update({
        where: { slug: HERO_SLUG },
        data: {
          body: JSON.stringify(slidesData),
          bodyAr: JSON.stringify(slidesData)
        }
      });

      // Optional: Delete image file
      // if (slideToDelete.image) {
      //   fileUploadService.deleteFile(slideToDelete.image);
      // }

      return {
        success: true,
        message: 'Slide deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  },

  // Reorder slides
  reorderSlides: async (slidesOrder) => {
    try {
      const heroPage = await prisma.sitePage.findUnique({
        where: { slug: HERO_SLUG }
      });

      if (!heroPage) {
        throw new Error('Hero slider not found');
      }

      const slidesData = JSON.parse(heroPage.body);

      // Update orders based on the provided order
      slidesOrder.forEach(({ id, order }) => {
        const slide = slidesData.slides.find(s => s.id === id);
        if (slide) {
          slide.order = order;
          slide.updatedAt = new Date().toISOString();
        }
      });

      // Sort by order
      slidesData.slides.sort((a, b) => a.order - b.order);

      await prisma.sitePage.update({
        where: { slug: HERO_SLUG },
        data: {
          body: JSON.stringify(slidesData),
          bodyAr: JSON.stringify(slidesData)
        }
      });

      return {
        success: true,
        message: 'Slides reordered successfully'
      };
    } catch (error) {
      throw error;
    }
  },

  // Toggle slide active status
  toggleSlideActive: async (id, isActive) => {
    try {
      const heroPage = await prisma.sitePage.findUnique({
        where: { slug: HERO_SLUG }
      });

      if (!heroPage) {
        throw new Error('Hero slider not found');
      }

      const slidesData = JSON.parse(heroPage.body);
      const slideIndex = slidesData.slides.findIndex(s => s.id === id);

      if (slideIndex === -1) {
        throw new Error('Slide not found');
      }

      slidesData.slides[slideIndex].isActive = isActive;
      slidesData.slides[slideIndex].updatedAt = new Date().toISOString();

      await prisma.sitePage.update({
        where: { slug: HERO_SLUG },
        data: {
          body: JSON.stringify(slidesData),
          bodyAr: JSON.stringify(slidesData)
        }
      });

      return {
        success: true,
        data: slidesData.slides[slideIndex],
        message: `Slide ${isActive ? 'activated' : 'deactivated'} successfully`
      };
    } catch (error) {
      throw error;
    }
  },

  // Initialize default hero slider if not exists
  initializeDefault: async () => {
    try {
      const existing = await prisma.sitePage.findUnique({
        where: { slug: HERO_SLUG }
      });

      if (!existing) {
        const defaultSlides = [
          {
            id: 'default-1',
            image: '/uploads/hero/default-1.jpg',
            title: 'Learn Quran Online',
            titleAr: 'تعلم القرآن أونلاين',
            description: 'Join the best platform for Quran learning with expert teachers',
            descriptionAr: 'انضم إلى أفضل منصة لتعلم القرآن مع معلمين خبراء',
            buttonText: 'Get Started',
            buttonTextAr: 'ابدأ الآن',
            buttonLink: '/courses',
            order: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        await prisma.sitePage.create({
          data: {
            slug: HERO_SLUG,
            title: 'Hero Slider',
            titleAr: 'الشريط المتحرك',
            body: JSON.stringify({ slides: defaultSlides }),
            bodyAr: JSON.stringify({ slides: defaultSlides })
          }
        });
      }

      return {
        success: true,
        message: 'Hero slider initialized'
      };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = heroService;