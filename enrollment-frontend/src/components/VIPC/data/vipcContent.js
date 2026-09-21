// Central content for the VIPC public website. Sourced from the live vipc.edu.ph
// site so the modernized rebuild keeps the same details. Edit here to update copy.

export const SCHOOL = {
  name: 'Vineyard International Polytechnic College',
  shortName: 'VIPC',
  established: 2007,
  tagline: "It's the here and now that matter most.",
  subTagline: 'START YOUR JOURNEY HERE.',
  logo: '/vipc.png',
  seal: '/circlelogo.png',
};

export const CONTACT = {
  address: 'Prince Padi Building, A. Luna St., Mabulay Subd., Cagayan de Oro City 9000, Philippines',
  phones: ['0917-770-0173', '(088) 856-8646'],
  email: 'vipccdo07@gmail.com',
  hours: [
    { day: 'Monday – Saturday', time: '8:00 AM – 5:00 PM' },
    { day: 'Sunday', time: 'Closed' },
  ],
  socials: [
    { name: 'Facebook', url: 'https://facebook.com/vineyardcollege/', handle: '/vineyardcollege' },
    { name: 'Twitter', url: 'https://twitter.com/VIPC_PH', handle: '@VIPC_PH' },
    { name: 'Instagram', url: 'https://instagram.com/vineyard.college/', handle: '@vineyard.college' },
    { name: 'YouTube', url: 'https://youtube.com/channel/UCQMVzOODpRP_3yGlJYXVmHw', handle: 'Vineyard College' },
  ],
};

export const WELCOME_PARAGRAPHS = [
  "Welcome to Vineyard International Polytechnic College's website. We are thrilled to have you visit us and explore everything that our college has to offer. Whether you're a prospective student, a current student, an alumni, or simply someone interested in learning more about our institution, we hope you'll find this website informative, engaging, and inspiring.",
  "As you navigate through our website, you'll find information on admissions, academic programs, campus facilities, student support services, and exciting events happening throughout the year.",
  "Whether you're looking to pursue your passions, expand your knowledge, or embark on a transformative educational journey, we invite you to be a part of our community. Join us as we strive for excellence, embrace diversity, and shape the leaders of tomorrow.",
  'Once again, welcome to VIPC.',
];

export const ABOUT = {
  intro:
    'Vineyard College is a non-stock and non-profit Educational Institution established with the main purpose of providing quality basic, technical/vocational, higher and advanced education responsive to the need of time and society.',
  vision:
    'A center of education that develops globally competitive individuals who are equipped with the right knowledge, skills, values & attitude.',
  mission:
    'Vineyard College promotes positive learning opportunities through leadership by example and life-long learning to meet the needs of our diverse community.',
  coreValues: [
    'Respect and concern for students and colleagues',
    'Effective collaboration and teamwork',
    'Adaptability and productive engagement between students and staff',
    'Leadership and accountability for performance and action',
  ],
  strengths: [
    {
      icon: 'ShieldCheck',
      title: 'Nationally Registered',
      text: 'Registered with DepEd, TESDA, CHED, and the Department of Tourism (DOT) of the Philippines.',
    },
    {
      icon: 'Building2',
      title: 'Industry-Standard Facilities',
      text: 'Industry-standard hospitality and culinary training facilities that simulate the real workplace.',
    },
    {
      icon: 'Globe2',
      title: 'Strong Industry Linkage',
      text: 'Direct connections with various hotels and resorts throughout Asia and Australia.',
    },
  ],
};

// Program catalog grouped by institute/level.
export const PROGRAM_GROUPS = [
  {
    id: 'bachelor',
    label: 'Bachelor Programs',
    badge: '4-Year Degree',
    icon: 'GraduationCap',
    blurb:
      'Four-year degree programs that blend theory with hands-on, industry-aligned training for a globally competitive career.',
    programs: [
      {
        name: 'BS in Hospitality Management',
        image: '/vipc/prog-bachelor-1.avif',
        text: 'The Tourism and Hospitality industry is the world’s fastest-growing industry, offering a wide range of opportunities and a rewarding career. The program combines practical and theoretical coursework with an emphasis on training that meets international standards.',
      },
      {
        name: 'BS in Business Administration — Major in Marketing Management',
        image: '/vipc/prog-bachelor-2.avif',
        text: 'Prepares students with contemporary business skills by integrating theory and practice, emphasizing effective communication and a technological focus to enhance career readiness.',
      },
      {
        name: 'BS in Business Administration — Major in Human Resource Management',
        image: '/vipc/prog-bachelor-3.avif',
        text: 'Establishes foundational HR concepts, processes, and contemporary developments, equipping students with the practical tools to become successful human resource managers.',
      },
      {
        name: 'Bachelor of Technical-Vocational Teacher Education — Food Service Management',
        image: '/vipc/prog-bachelor-4.avif',
        text: 'A four-year program that builds the knowledge and teaching skills for technical-vocational courses, with a strong grounding in teaching and learning principles.',
      },
    ],
  },
  {
    id: 'three-year',
    label: 'VIPC 3-Year Program',
    badge: '3-Year Diploma',
    icon: 'Layers',
    blurb: 'A ladderized three-year diploma program advancing through innovation and modern industry technology.',
    programs: [
      {
        name: 'Diploma in Hospitality Technology',
        image: '/vipc/prog-3yr-1.avif',
        text: 'In our Hospitality Technology, you will identify the latest trends found throughout the industry and address what the industry is doing to adapt to modern technology. It has advanced through innovation in the application of machines and tools, systems and organizations.',
      },
    ],
  },
  {
    id: 'two-year',
    label: 'VIPC 2-Year Programs',
    badge: '2-Year Diploma',
    icon: 'Layers',
    blurb: 'Two-year diploma programs that combine knowledge with simulated, real-world practical training for in-demand careers.',
    programs: [
      {
        name: 'Tourism Management Technology',
        image: '/vipc/prog-2yr-1.avif',
        text: 'The Tourism Management Technology presents the strategic information technology needed to achieve long-term success in the hospitality and tourism industry. It prepares you in the tourism and travel occupations. It aims to be a source of information for all those interested in tourism and hospitality management, approaches and trends.',
      },
      {
        name: 'Cruise Line Services',
        image: '/vipc/prog-2yr-2.avif',
        text: 'The 2-year Cruise Line Services program is a structured approach to deliver high-quality customer service and enhance the overall passenger experience during a cruise. It includes training students as future staff, setting service standards, designing onboard amenities and activities, ensuring safety protocols, and addressing customer needs to create a memorable and enjoyable voyage for passengers.',
      },
      {
        name: 'Hotel and Restaurant Services',
        image: '/vipc/prog-2yr-3.avif',
        text: 'This two-year program is designed to equip students with the knowledge and practical skills needed to succeed for a career in the hospitality and tourism industry. This large industry has a continuous demand for highly skilled, people-oriented graduates with good service orientation and managerial techniques. Although the hospitality industry involves long hours and shift work, it can also be rewarding. To acquaint students with these working conditions, we simulate our practical programs as if they are working in the real world, thus making them prepared to tackle any obstacles that the hospitality industry has in store for them.',
      },
      {
        name: 'Office and Business Management',
        image: '/vipc/prog-2yr-4.avif',
        text: 'Our Office and Business Management program is designed for students who seek positions in the field of management. This course helps prepare students for work in the business industry and government agencies. It covers planning, administration, staffing, analytical and organizational skills. With this diploma, students can specialize in fields such as accounting, information systems, public relations, and industrial management.',
      },
    ],
  },
  {
    id: 'senior-high',
    label: 'Senior High School',
    badge: 'Grades 11 – 12',
    icon: 'School',
    blurb:
      'A K-12 senior high program aligned with ASEAN integration, letting students earn National Certificates within their chosen track.',
    programs: [
      { name: 'Academic Track — Accountancy, Business and Management (ABM)', image: '/vipc/prog-shs-1.avif', text: 'Builds a strong foundation in business, accounting, and management for future entrepreneurs and business leaders.' },
      { name: 'TVL — Home Economics: Cookery NC II', image: '/vipc/prog-shs-2.avif', text: 'Technical-vocational specialization in professional cookery, TESDA-assessed for National Certificate II.' },
      { name: 'TVL — Home Economics: Bread and Pastry Production NC II', image: '/vipc/prog-shs-3.avif', text: 'Hands-on baking and pastry training leading to TESDA National Certificate II.' },
      { name: 'TVL — Home Economics: Food and Beverage Services NC II', image: '/vipc/prog-shs-1.avif', text: 'Service-industry training in food and beverage operations, TESDA-assessed for NC II.' },
      { name: 'TVL — Travel Services: Housekeeping NC II', image: '/vipc/prog-shs-2.avif', text: 'Accommodation and housekeeping operations training leading to NC II.' },
      { name: 'TVL — Travel Services: Tourism Promotion Services NC II', image: '/vipc/prog-shs-3.avif', text: 'Tourism promotion and services training leading to NC II.' },
    ],
  },
  {
    id: 'culinary',
    label: 'Vineyard Culinary Institute',
    badge: 'TESDA Short Courses',
    icon: 'ChefHat',
    blurb:
      'Intensive, hands-on culinary training in small groups with industry-experienced instructors and state-of-the-art facilities. Includes ingredients, chef’s jacket, cap, pants, full-length apron, chef’s knife set, handouts and recipes.',
    programs: [
      { name: 'Certificate Program in Culinary Arts', image: '/vipc/prog-culinary-1.avif', text: 'A 3-month program covering cooking techniques, knife skills, vegetable cuts and butchery, stocks, soups and sauces, plate design, and sanitation standards.', meta: '3 Months' },
      { name: 'Certificate in Confectionery and Pastry Arts', image: '/vipc/prog-culinary-2.avif', text: 'A 3-month program focused on baking, confectionery, and pastry arts.', meta: '3 Months' },
      { name: 'Diploma in Culinary Arts', image: '/vipc/prog-culinary-3.avif', text: 'A 6-month diploma for a deeper, comprehensive culinary education.', meta: '6 Months' },
    ],
  },
  {
    id: 'institutes',
    label: 'Specialized Institutes & Programs',
    badge: 'Technical · Vocational',
    icon: 'Layers',
    blurb:
      'Additional ladderized and specialized programs across the Vineyard institutes. Inquire through Online Enrollment for the latest offerings, schedules, and requirements.',
    programs: [
      { name: 'Vineyard Technical Institute', text: 'TESDA-aligned technical and vocational training programs.' },
      { name: 'Vineyard School of Construction', text: 'Skills training for the construction and building trades.' },
      { name: 'Royal Ace Institute of Gaming', text: 'Specialized training for the gaming and casino services industry.' },
    ],
  },
];

// "Why choose VIPC" highlights for the home page.
export const HIGHLIGHTS = [
  { icon: 'Award', title: 'TESDA Accredited', text: 'A nationally recognized, accredited institution.' },
  { icon: 'Building2', title: 'Modern Facilities', text: 'Air-conditioned, state-of-the-art training labs.' },
  { icon: 'Users', title: 'Small Class Sizes', text: 'Individualized attention from expert instructors.' },
  { icon: 'Globe2', title: 'Global Linkages', text: 'Industry partners across Asia and Australia.' },
];

export const NEWS = [
  {
    title: 'POP-UP EVENT 2024',
    date: 'Apr 17, 2024',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Events',
    image: '/vipc/news-1.avif',
    excerpt:
      "Vineyard Culinary Institute's Pop-Up Dinner Event successfully concluded with an indulgence of Culinary Symphony — a fine dining experience showcasing the talent and creativity of our culinary students.",
    views: 406,
    comments: 1,
    likes: 5,
  },
  {
    title: 'CAREER GUIDANCE — MOGCHS SENIOR HIGH SCHOOL EXPO 2024',
    date: 'Apr 17, 2024',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Outreach',
    image: '/vipc/news-2.avif',
    excerpt:
      'Vineyard College had an amazing time contributing to the "First Step to a Strong Future: Senior High School Expo" at the Misamis Oriental General Comprehensive High School (MOGCHS).',
    views: 365,
    comments: 4,
    likes: 4,
  },
  {
    title: 'VIPC 17TH FOUNDING ANNIVERSARY',
    date: 'Apr 17, 2024',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Milestones',
    image: '/vipc/news-3.avif',
    excerpt:
      "Vineyard International Polytechnic College celebrated its 17th Foundation Day with the theme \"Excellence Forged in Challenges\" — honoring 17 years of quality education and service.",
    views: 312,
    comments: 2,
    likes: 8,
  },
  {
    title: "VIPC STUDENTS' CHRISTMAS PARTY 2023",
    date: 'Apr 17, 2024',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Events',
    image: '/vipc/news-4.avif',
    excerpt:
      'The Vineyard community came together for a festive and memorable Students\' Christmas Party 2023, full of joy, performances, and holiday cheer.',
    views: 120,
    comments: 10,
    likes: 1,
  },
  {
    title: 'CHEF ON PARADE 2023 — TILAW MINDANAO',
    date: 'Apr 17, 2024',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Events',
    image: '/vipc/news-5.avif',
    excerpt:
      'Chef on Parade: Tilaw Mindanao Food Showdown of LaVignians was a gastronomic journey held on the 13th of December 2023, where our talented students showcased their culinary artistry.',
    views: 154,
    comments: 52,
    likes: 7,
  },
  {
    title: 'LIMKETKAI GIFT FAIR',
    date: 'Apr 17, 2024',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Events',
    image: '/vipc/news-6.avif',
    excerpt:
      'Relive the magic of the Gift Fair held on the 9th of December 2023 at the Activity Center, Limketkai! The talented students of Vineyard brought festive cheer to the community.',
    views: 132,
    comments: 3,
    likes: 6,
  },
  {
    title: '2GO OCULAR VISIT',
    date: 'Apr 17, 2024',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Industry',
    image: '/vipc/news-7.avif',
    excerpt:
      'Vineyard College had the incredible opportunity to explore the 2Go Travel Maligaya Vessel, marking the beginning of a valuable industry immersion experience for our students.',
    views: 98,
    comments: 1,
    likes: 4,
  },
  {
    title: 'VIPC INTRAMURALS — PANAGBANGI 2023',
    date: 'Apr 17, 2024',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Sports',
    image: '/vipc/news-8.avif',
    excerpt:
      'PANAGBANGI 2023: "Empowering LaVignians by Integrating Academic Excellence, Solidarity, and Sportsmanship" — a spirited week of intramural games and camaraderie.',
    views: 176,
    comments: 5,
    likes: 9,
  },
  {
    title: 'HIGALAAY FESTIVAL 2023',
    date: 'Apr 15, 2024',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Community',
    image: '/vipc/news-9.avif',
    excerpt:
      'The Higalaay Street Parade and Float in Cagayan de Oro City on the 27th of August 2023 was a vibrant celebration of culture and community that the Vineyard family proudly joined.',
    views: 145,
    comments: 2,
    likes: 7,
  },
  {
    title: 'FOUNDATION DAY AND INTRAMURALS 2023',
    date: 'May 12, 2023',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Milestones',
    image: '/vipc/news-10.avif',
    excerpt:
      'Vineyard College celebrated its Foundation Day and Intramurals 2023 with the theme "Veracious as it was before; Innovative and Productive as it is now."',
    views: 210,
    comments: 6,
    likes: 11,
  },
  {
    title: 'VINEYARD COLLEGE 16TH FOUNDING ANNIVERSARY',
    date: 'May 12, 2023',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Milestones',
    image: '/vipc/news-11.avif',
    excerpt:
      'Vineyard College celebrated its 16th founding anniversary with a mass blessing attended by students, faculty, and staff on January 24, 2023.',
    views: 188,
    comments: 3,
    likes: 8,
  },
  {
    title: 'NSTP TREE PLANTING',
    date: 'May 12, 2023',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Outreach',
    image: '/vipc/news-12.avif',
    excerpt:
      'The NSTP students of Vineyard College conducted a Tree Planting activity in Barangay Lombo, Alubijid, Misamis Oriental, helping protect and restore the environment.',
    views: 167,
    comments: 4,
    likes: 6,
  },
  {
    title: 'CEREMONIAL SIGNING 2022',
    date: 'Sep 06, 2022',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Partnership',
    image: '/vipc/news-13.avif',
    excerpt:
      'Ceremonial Signing of Central Mindanao University (CMU) and Vineyard International Polytechnic College (VIPC) with the Glan Institute of Technology.',
    views: 142,
    comments: 2,
    likes: 5,
  },
  {
    title: 'VIPC 14TH COMMENCEMENT EXERCISES',
    date: 'Sep 06, 2022',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Milestones',
    image: '/vipc/news-14.avif',
    excerpt:
      'Vineyard International Polytechnic College held its 14th Commencement Exercises on July 18, 2022, celebrating the achievements and bright futures of its graduates.',
    views: 256,
    comments: 7,
    likes: 12,
  },
  {
    title: 'STUDENT HANDBOOK',
    date: 'Jan 24, 2022',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Announcement',
    image: '/vipc/news-15.avif',
    excerpt:
      'The student handbook of Vineyard International Polytechnic College aims to create an environment conducive for your learning, growth, and success.',
    views: 320,
    comments: 9,
    likes: 10,
  },
  {
    title: 'CHRISTMAS PARTY 2019',
    date: 'Dec 20, 2019',
    readTime: '1 min read',
    author: 'Vineyard College',
    category: 'Events',
    image: '/vipc/news-16.avif',
    excerpt:
      'The Vineyard community gathered for a joyful Christmas Party in December 2019, celebrating the season with festive performances, games, and fellowship.',
    views: 134,
    comments: 2,
    likes: 5,
  },
];

// Enrollment-type quick cards on the home page (mirrors the live site).
export const ENROLL_CATEGORIES = [
  { label: 'New Student', icon: 'UserPlus', text: 'Begin your Vineyard journey as a first-time enrollee.' },
  { label: 'Transferee', icon: 'Repeat', text: 'Continue your studies and transfer your credits to VIPC.' },
  { label: 'Alumni', icon: 'Award', text: 'Reconnect with your alma mater and our community.' },
  { label: 'Scholarships', icon: 'GraduationCap', text: 'Explore scholarship and financial assistance options.' },
];

// "Our Institution" facility gallery on the About page (real campus photos).
export const FACILITY_GALLERY = [
  { src: '/vipc/inst-1.avif', label: 'Function Hall' },
  { src: '/vipc/inst-2.avif', label: 'Computer Laboratory' },
  { src: '/vipc/inst-3.avif', label: 'Culinary Kitchen' },
  { src: '/vipc/inst-4.avif', label: 'Photography Studio' },
  { src: '/vipc/inst-5.avif', label: 'Bartending Area' },
  { src: '/vipc/inst-6.avif', label: 'Library' },
  { src: '/vipc/inst-7.avif', label: 'AV / Lecture Room' },
  { src: '/vipc/inst-8.avif', label: 'Classroom' },
];

// "Our Programs" mega-menu items (mirrors the live site dropdown).
// `target` is the id of the matching section on the Programs page so the
// dropdown can deep-link straight to that program group.
export const PROGRAM_NAV = [
  { label: 'VIPC Bachelor Programs', target: 'bachelor' },
  { label: 'VIPC 3-Year Program', target: 'three-year' },
  { label: 'VIPC 2-Year Programs', target: 'two-year' },
  { label: 'VIPC Senior Highschool', target: 'senior-high' },
  { label: 'Vineyard Culinary Institute', target: 'culinary' },
  { label: 'Vineyard Technical Institute', target: 'institutes' },
  { label: 'Vineyard School of Construction', target: 'institutes' },
  { label: 'Royal Ace Institute of Gaming', target: 'institutes' },
];

// Footer "Programs" column (mirrors the live site footer).
export const FOOTER_PROGRAMS = [
  'Vineyard College',
  'Vineyard Culinary Institute',
  'Vineyard Technical Institute',
  'Vineyard School of Construction',
  'Royal Ace Institute of Gaming',
  'VIPC Online Library',
];
