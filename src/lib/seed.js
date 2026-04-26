import dbConnect from './mongodb';
import Template from '../models/Template';
import Experience from '../models/Experience';
import AnalyticsEvent from '../models/AnalyticsEvent';

export async function seedDatabase() {
  await dbConnect();

  const count = await Template.countDocuments();
  if (count === 0) {
    await seedTemplates();
  }

  const expCount = await Experience.countDocuments();
  if (expCount === 0) {
    await seedExperiences();
  }
}

async function seedTemplates() {
  const templates = [
    {
      id: 'tmpl-story-1',
      title: 'Brand Story',
      description: 'An immersive scrolling narrative to tell your brand\'s journey and values.',
      type: 'story',
      category: 'marketing',
      thumbnail: '📖',
      blocks: [
        { type: 'hero', content: { title: 'Our Story', subtitle: 'From humble beginnings to global impact' } },
        { type: 'text', content: { body: 'Every great journey starts with a single step...' } },
        { type: 'timeline', content: { items: [{ year: '2020', text: 'Founded' }, { year: '2022', text: 'Global expansion' }] } },
        { type: 'cta', content: { label: 'Join Our Journey', url: '#' } }
      ],
      popularity: 156
    },
    {
      id: 'tmpl-quiz-1',
      title: 'Knowledge Assessment',
      description: 'Interactive quiz with scoring, progress tracking, and result insights.',
      type: 'quiz',
      category: 'education',
      thumbnail: '🧠',
      blocks: [
        { type: 'hero', content: { title: 'Test Your Knowledge', subtitle: 'See how much you really know' } },
        { type: 'quiz', content: { question: 'Sample question?', options: ['A', 'B', 'C', 'D'], correct: 0 } }
      ],
      popularity: 243
    },
    {
      id: 'tmpl-landing-1',
      title: 'Product Launch',
      description: 'High-converting landing page for product launches with animated sections.',
      type: 'landing',
      category: 'marketing',
      thumbnail: '🚀',
      blocks: [
        { type: 'hero', content: { title: 'Introducing the Future', subtitle: 'The product you\'ve been waiting for' } },
        { type: 'features', content: { items: [{ icon: '⚡', title: 'Fast', desc: 'Lightning fast performance' }] } },
        { type: 'pricing', content: { plans: [{ name: 'Starter', price: '$9' }] } },
        { type: 'cta', content: { label: 'Get Started Free', url: '#' } }
      ],
      popularity: 312
    },
    {
      id: 'tmpl-presentation-1',
      title: 'Pitch Deck',
      description: 'Professional pitch deck with smooth slide transitions and data viz.',
      type: 'presentation',
      category: 'business',
      thumbnail: '📊',
      blocks: [
        { type: 'slide', content: { title: 'Welcome', subtitle: 'Company Pitch Deck 2026' } },
        { type: 'slide', content: { title: 'The Problem', body: 'Current solutions are outdated...' } },
        { type: 'slide', content: { title: 'Our Solution', body: 'We built something revolutionary.' } }
      ],
      popularity: 189
    },
    {
      id: 'tmpl-infographic-1',
      title: 'Data Storyteller',
      description: 'Transform data into beautiful, scrollable infographic experiences.',
      type: 'infographic',
      category: 'education',
      thumbnail: '📈',
      blocks: [
        { type: 'hero', content: { title: 'The State of AI in 2026' } },
        { type: 'stat', content: { value: '85%', label: 'Companies using AI' } },
        { type: 'chart', content: { type: 'bar', data: [10, 20, 40, 80] } }
      ],
      popularity: 178
    },
    {
      id: 'tmpl-microsite-1',
      title: 'Event Microsite',
      description: 'Complete event microsite with agenda, speakers, and registration.',
      type: 'microsite',
      category: 'events',
      thumbnail: '🎪',
      blocks: [
        { type: 'hero', content: { title: 'Tech Summit 2026', subtitle: 'Join 5000+ innovators' } },
        { type: 'agenda', content: { items: [{ time: '9:00 AM', title: 'Keynote' }] } },
        { type: 'cta', content: { label: 'Register Now', url: '#' } }
      ],
      popularity: 201
    },
    {
      id: 'tmpl-portfolio-1',
      title: 'Creative Portfolio',
      description: 'Showcase your work with elegant galleries and case studies.',
      type: 'story',
      category: 'portfolio',
      thumbnail: '🎨',
      blocks: [
        { type: 'hero', content: { title: 'My Work', subtitle: 'Selected projects and case studies' } },
        { type: 'gallery', content: { images: [] } },
        { type: 'text', content: { body: 'Each project represents months of dedicated craftsmanship.' } }
      ],
      popularity: 145
    },
    {
      id: 'tmpl-story-2',
      title: 'Customer Journey',
      description: 'Map your customer journey with interactive touchpoints and insights.',
      type: 'story',
      category: 'marketing',
      thumbnail: '🗺️',
      blocks: [
        { type: 'hero', content: { title: 'Customer Journey Map' } },
        { type: 'timeline', content: { items: [{ year: 'Awareness', text: 'Discovery phase' }] } }
      ],
      popularity: 167
    },
    {
      id: 'tmpl-quiz-2',
      title: 'Product Recommender',
      description: 'Guide users to the right product through an interactive quiz funnel.',
      type: 'quiz',
      category: 'marketing',
      thumbnail: '🎯',
      blocks: [
        { type: 'hero', content: { title: 'Find Your Perfect Match' } },
        { type: 'quiz', content: { question: 'What matters most to you?', options: ['Speed', 'Design', 'Price', 'Features'], correct: -1 } }
      ],
      popularity: 234
    },
  ];

  await Template.insertMany(templates);
}

async function seedExperiences() {
  const experiences = [
    {
      id: 'exp-demo-1',
      title: 'Welcome to CXP',
      description: 'Your first interactive experience — explore what\'s possible.',
      type: 'story',
      status: 'published',
      content: 'Welcome to the Content-to-Experience Platform!',
      blocks: [
        { id: 'b1', type: 'hero', content: { title: 'Welcome to CXP', subtitle: 'Transform content into magic ✨' }, order: 0 },
        { id: 'b2', type: 'text', content: { body: 'This platform helps you transform any raw content — articles, docs, data — into stunning interactive experiences that engage your audience.' }, order: 1 },
        { id: 'b3', type: 'features', content: { items: [
          { icon: '🤖', title: 'AI-Powered', desc: 'Intelligent content transformation' },
          { icon: '🎨', title: 'Visual Builder', desc: 'Drag-and-drop editing' },
          { icon: '📊', title: 'Analytics', desc: 'Track engagement in real-time' }
        ]}, order: 2 },
        { id: 'b4', type: 'cta', content: { label: 'Start Creating', url: '/studio' }, order: 3 }
      ],
      tags: ['demo', 'welcome'],
      views: 1247,
      engagement_rate: 78.5
    },
    {
      id: 'exp-demo-2',
      title: 'AI Revolution Report',
      description: 'Interactive infographic on the state of AI in 2026.',
      type: 'infographic',
      status: 'published',
      content: 'The AI landscape is evolving rapidly...',
      blocks: [
        { id: 'b1', type: 'hero', content: { title: 'The AI Revolution', subtitle: 'Key insights from 2026' }, order: 0 },
        { id: 'b2', type: 'stat', content: { value: '92%', label: 'Enterprise AI adoption' }, order: 1 },
        { id: 'b3', type: 'text', content: { body: 'Artificial intelligence has transformed every major industry...' }, order: 2 }
      ],
      tags: ['ai', 'report', 'infographic'],
      views: 856,
      engagement_rate: 82.3
    },
    {
      id: 'exp-demo-3',
      title: 'Product Knowledge Quiz',
      description: 'Test your team\'s product knowledge with this interactive quiz.',
      type: 'quiz',
      status: 'draft',
      content: 'How well do you know our product?',
      blocks: [
        { id: 'b1', type: 'hero', content: { title: 'Product Knowledge Quiz', subtitle: 'Let\'s see what you know!' }, order: 0 },
        { id: 'b2', type: 'quiz', content: { question: 'What year was CXP founded?', options: ['2024', '2025', '2026'], correct: 2 }, order: 1 }
      ],
      tags: ['quiz', 'training'],
      views: 342,
      engagement_rate: 91.2
    },
    {
      id: 'exp-demo-4',
      title: 'Q2 Strategy Presentation',
      description: 'Interactive strategy deck for Q2 planning session.',
      type: 'presentation',
      status: 'draft',
      content: 'Q2 Strategic priorities...',
      blocks: [
        { id: 'b1', type: 'slide', content: { title: 'Q2 Strategy', subtitle: 'Growth & Innovation' }, order: 0 }
      ],
      tags: ['strategy', 'presentation'],
      views: 128,
      engagement_rate: 65.8
    },
  ];

  await Experience.insertMany(experiences);

  // Seed analytics
  const events = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    for (const exp of experiences) {
      const viewCount = Math.floor(Math.random() * 50) + 10;
      for (let v = 0; v < viewCount; v++) {
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        const eventDate = new Date(date);
        eventDate.setHours(randomHour, randomMinute, 0, 0);
        
        events.push({
          experience_id: exp.id,
          event_type: 'view',
          metadata: { source: ['direct', 'social', 'email', 'search'][Math.floor(Math.random() * 4)] },
          created_at: eventDate
        });
      }
      const engageCount = Math.floor(viewCount * (0.3 + Math.random() * 0.5));
      for (let e = 0; e < engageCount; e++) {
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        const eventDate = new Date(date);
        eventDate.setHours(randomHour, randomMinute, 0, 0);
        
        events.push({
          experience_id: exp.id,
          event_type: 'engagement',
          metadata: { action: ['click', 'scroll', 'interact', 'share'][Math.floor(Math.random() * 4)] },
          created_at: eventDate
        });
      }
    }
  }
  
  await AnalyticsEvent.insertMany(events);
}
