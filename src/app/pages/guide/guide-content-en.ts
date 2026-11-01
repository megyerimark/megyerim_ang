import type { GuideKey } from '../../core/site-routes';
import type { Guide } from './guide-content';

/**
 * Az útmutatók angol változata (/en/guides/<slug>). Szerkezete és állításai megegyeznek a magyar
 * guide-content.ts-sel; a prerender is innen készíti az angol statikus HTML-t, ezért futásidejű importot nem tartalmazhat.
 */
export const GUIDES_EN: Record<GuideKey, Guide> = {
    price: {
        label: 'Website cost',
        seoTitle: 'How much does a website cost? What drives the price | Márk Máté Megyeri',
        seoDescription: 'What does a website’s price depend on? Number of pages, custom design, features, content, hosting and maintenance – how to plan a realistic budget.',
        h1: 'How much does a website cost, and what drives the price?',
        intro: 'The honest answer to “how much does a website cost?” is: it depends on what it needs to do. In this guide we walk through the factors that determine the price, where it’s worth spending, and how to request quotes you can actually compare.',
        minutes: 6,
        updated: '2026-11-01',
        sections: [
            {
                h2: 'Why there is no single “website price”',
                paragraphs: [
                    'There’s an order-of-magnitude difference in effort between a one-page introduction site and a business website with a booking system and an admin panel – just like between building a studio flat and a family house.',
                    'Most of the price is the time spent on planning, development and testing. The more custom elements, features and subpages are needed, the more time it takes.',
                ],
            },
            {
                h2: 'The most important price factors',
                paragraphs: ['When comparing quotes, put these points side by side:'],
                list: [
                    'Number of pages and structure: a one-page landing page, a business site with 4–6 subpages, or a larger site with categories.',
                    'Design: customising a ready-made template or a fully custom look designed around your brand.',
                    'Features: contact form, appointment booking, multiple languages, online payment, newsletter, admin panel.',
                    'Content: you provide the copy and images, or copywriting, photography and illustrations are needed too.',
                    'SEO basics: fast loading, correct titles and descriptions, structured data, sitemap.',
                    'Operation: domain, hosting, SSL, backups, updates and later changes.',
                ],
            },
            {
                h2: 'One-off and ongoing costs',
                paragraphs: [
                    'Development is usually a one-off fee. On top of that there are ongoing items: the yearly fee for the domain and hosting and, if you ask for it, maintenance (updates, backups, small changes, monitoring).',
                    'It’s worth asking up front what is included in the price and what counts as an extra – that way there are no surprises later.',
                ],
            },
            {
                h2: 'Where not to cut corners',
                paragraphs: ['Some things are much more expensive to fix later than to get right the first time:'],
                list: [
                    'The mobile experience – a large share of visitors arrive on their phone.',
                    'Loading speed – many people leave a slow site before it even appears.',
                    'A clear way to get in touch – if the next step isn’t obvious, the lead is lost.',
                    'Security and backups – restoring a hacked or lost site costs time and trust.',
                ],
            },
            {
                h2: 'How to request comparable quotes',
                paragraphs: [
                    'Briefly describe what your business does, who the site is for and what it needs to achieve (for example more enquiries or bookings). List the features you need and mention whether you already have a brand identity, copy or images.',
                    'If you have a budget in mind, share it too: the proposal can then be tailored to it, and you’ll see what you get for it.',
                ],
            },
        ],
        faq: [
            { q: 'Can I get an exact price without requesting a quote?', a: 'An exact price can only be given once the requirements are known. After the short quote form or the 2-minute project quiz you receive a tailored written proposal with no obligation.' },
            { q: 'What’s the price difference between a template and a custom website?', a: 'A template gives a starting point, so there’s less design work – in exchange, the look and structure are more constrained. With a custom design everything is tailored to your brand and goals, which means more design time.' },
            { q: 'Can I pay in instalments?', a: 'Work usually starts with a deposit, and the remaining balance is due at handover. The exact terms are set out in the written proposal.' },
        ],
        related: 'web',
        ctaTitle: 'Curious what your website would cost?',
        ctaText: 'Describe your idea in a few sentences and you’ll receive a tailored proposal – with no obligation.',
    },
    'landing-vs-business': {
        label: 'Landing page or business site?',
        seoTitle: 'Landing page or business website? Which one do you need? | Márk Máté Megyeri',
        seoDescription: 'Landing page or multi-page business website? When each is the better choice, what their advantages are, and when it’s worth using both together.',
        h1: 'Landing page or business website: which one do you need?',
        intro: 'Both are websites, but they’re built for different jobs. A landing page focuses on a single goal, while a business website presents your whole company. Here’s when each one is the better choice – and when it pays to use both.',
        minutes: 5,
        updated: '2026-11-01',
        sections: [
            {
                h2: 'What is a landing page?',
                paragraphs: [
                    'A landing page is built around one clearly defined goal: for example presenting a service, a campaign or an event, with a single clear call to action (request a quote, sign up, book).',
                    'It has few menu items and no detours: it guides the visitor through the key arguments to a decision.',
                ],
            },
            {
                h2: 'What is a business website?',
                paragraphs: [
                    'A business website is your company’s online “office”: it shows who you are, what services you offer, how you work and how to get in touch. It consists of several subpages and builds your brand and trust over the long term.',
                    'More subpages can appear in Google for more search terms, so it’s also a stronger foundation for SEO.',
                ],
            },
            {
                h2: 'When to choose a landing page',
                paragraphs: ['A landing page is a good choice if:'],
                list: [
                    'you want to launch a specific offer, campaign or new service quickly;',
                    'visitors arrive from ads (Google, Facebook) and you want to lead them to a single action;',
                    'your business is just starting out and a focused introduction is enough as a first step.',
                ],
            },
            {
                h2: 'When to choose a business website',
                paragraphs: ['A multi-page business website makes sense if:'],
                list: [
                    'you offer several services and want to present each one separately;',
                    'it matters that people find you on Google for several topics;',
                    'you also want to show references, your team, your process and FAQs;',
                    'you want to build your brand and content over the long term.',
                ],
            },
            {
                h2: 'Using both together',
                paragraphs: [
                    'A common and effective approach is to have the business website as the foundation and separate landing pages for campaigns. Visitors from ads see a focused page, while the brand stays consistent.',
                ],
            },
        ],
        faq: [
            { q: 'Can a landing page grow into a business website later?', a: 'Yes. If the landing page is built on a well-thought-out structure and brand identity, it can later be extended with more subpages.' },
            { q: 'Which one is faster to build?', a: 'Usually the landing page, as there are fewer subpages and less content. The exact timeline depends on the requirements and on when the content is ready.' },
            { q: 'I can’t decide which one I need. What should I do?', a: 'Fill in the 2-minute project quiz or book a free consultation – you’ll get a recommendation based on your goals.' },
        ],
        related: 'landing',
        ctaTitle: 'I’ll help you decide which one suits you',
        ctaText: 'Based on the 2-minute project quiz you’ll receive a tailored recommendation on which kind of website to start with.',
    },
    steps: {
        label: 'Website development steps',
        seoTitle: 'Building a website step by step – what to prepare | Márk Máté Megyeri',
        seoDescription: 'How does building a website work, from the first conversation to launch? The steps, your tasks, and a checklist of what to prepare.',
        h1: 'Building a website step by step: what should you prepare?',
        intro: 'If this is your first website project, it helps to know how the process works and when you’ll need to contribute. This guide explains the steps and what’s worth preparing in advance so everything runs smoothly.',
        minutes: 6,
        updated: '2026-11-01',
        sections: [
            {
                h2: '1. Consultation and proposal',
                paragraphs: [
                    'We discuss what your business does, who your customers are and what the site needs to achieve. Based on this you receive a written proposal covering scope, features, price and timeline.',
                ],
            },
            {
                h2: '2. Planning and design',
                paragraphs: [
                    'The site structure (which subpages, in what order, with what content) and the visual design are created. You approve them before development starts – so there are no surprises at the end.',
                ],
            },
            {
                h2: '3. Development and content',
                paragraphs: [
                    'The responsive, fast website is built with the required features, and the copy and images are added. The most common cause of delays at this stage is missing content – so it’s worth preparing it in good time.',
                ],
            },
            {
                h2: '4. Testing and launch',
                paragraphs: [
                    'The site is checked on different devices and browsers: forms, links, speed and the mobile layout. Then it moves to its final address, the SEO basics are set up, and you receive the necessary access details.',
                ],
            },
            {
                h2: '5. Afterwards: maintenance and growth',
                paragraphs: [
                    'A website isn’t “finished” at handover: updates, backups, small changes and new content keep it current and secure. If you’d like, I can take care of this under a maintenance agreement.',
                ],
            },
            {
                h2: 'Checklist: what to prepare',
                paragraphs: ['These can speed up the process a lot:'],
                list: [
                    'Your logo and brand elements (colours, fonts), if you already have them.',
                    'A list of your services with short descriptions.',
                    'An introduction about you or your team.',
                    'Your own photos (office, at work, products) – they’re more authentic than stock images.',
                    'References and testimonials, if you’d like to show them.',
                    'Contact details, opening hours and company details (for the legal notice).',
                    'A few websites you like (and some you don’t) – this helps a lot with the design.',
                    'Access to your existing domain and hosting, if you already have them.',
                ],
            },
        ],
        faq: [
            { q: 'How long does it take to build a website?', a: 'It depends on the scope, the features and when the content is ready. The exact timeline is part of the proposal and is agreed before development starts.' },
            { q: 'I don’t have any copy yet. Is that a problem?', a: 'No, but it’s worth working on it early. If you like, I can help with a draft that fits the structure, which you can then refine in your own words.' },
            { q: 'Will I be able to edit the site myself later?', a: 'Yes, if the project includes an admin panel or editable content. Otherwise I handle changes under a maintenance agreement or on request.' },
        ],
        related: 'web',
        ctaTitle: 'Let’s take the first step',
        ctaText: 'Book a free consultation, or describe your idea in the quote form.',
    },
    'speed-seo': {
        label: 'Speed and SEO basics',
        seoTitle: 'A fast, search-friendly website: 10 ground rules | Márk Máté Megyeri',
        seoDescription: 'What makes a website fast and easy to find? Ten practical ground rules on loading speed, mobile usability and search engine optimisation.',
        h1: 'A fast, search-friendly website: 10 ground rules',
        intro: 'Google favours pages that are fast, work well on mobile and have a clear structure – and visitors prefer to stay on them too. These ten ground rules help you assess where your website stands.',
        minutes: 7,
        updated: '2026-11-01',
        sections: [
            {
                h2: 'Speed',
                paragraphs: ['Many people leave a slow page before it even appears. Speed also plays a role in search rankings.'],
                list: [
                    '1. Optimised images: a modern format (such as WebP), a resolution matched to the display size, and lazy loading for images that aren’t visible yet.',
                    '2. Less and smaller JavaScript: load only what the first screen needs right away; the rest can come later.',
                    '3. Caching and compression: the browser shouldn’t re-download unchanged files, and the server should send them compressed.',
                    '4. Self-hosted fonts: fewer external requests, a faster first render and a privacy benefit too.',
                ],
            },
            {
                h2: 'Mobile and usability',
                paragraphs: [],
                list: [
                    '5. A mobile-first interface: readable font sizes, easy-to-tap buttons and no horizontal scrolling.',
                    '6. A clear next step: every page should make it obvious how to request a quote or get in touch.',
                ],
            },
            {
                h2: 'Search engine optimisation',
                paragraphs: [],
                list: [
                    '7. A unique title and description for each page: these appear in Google’s results – include what your customers search for.',
                    '8. A logical heading structure: one main heading (H1) per page, with subheadings organised by topic.',
                    '9. A separate page per topic: one service = one subpage. That way you can appear for more searches.',
                    '10. Technical basics: a sitemap (sitemap.xml), robots.txt, correct redirects, HTTPS, structured data and Google Search Console registration.',
                ],
            },
            {
                h2: 'How to measure it',
                paragraphs: [
                    'Google PageSpeed Insights shows your page speed on mobile and desktop for free, and Search Console shows which searches you appear for and whether there are indexing errors. It’s worth checking both regularly – a single new image or plugin can hurt the results.',
                ],
            },
        ],
        faq: [
            { q: 'How long until SEO shows results?', a: 'It depends on the competition and the content; typically weeks to months. The technical basics can be fixed faster, but good rankings also need regular, useful content.' },
            { q: 'What does the PageSpeed score mean?', a: 'It’s a 0–100 summary score for loading speed and stability. It’s not a goal in itself, but it shows well where the user experience can be improved.' },
            { q: 'Can you speed up my existing website?', a: 'In many cases, yes – by fixing images, the loading order and caching. First I review your current site and make a recommendation.' },
        ],
        related: 'care',
        ctaTitle: 'Would you like me to review your website?',
        ctaText: 'Send me its address in the quote form, and I’ll suggest improvements for speed and SEO.',
    },
};
