import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Revathi K. — Technical Lead | Full-Stack Web Development',
  description: 'Technical Lead with 10+ years of experience in web application development, maintenance, and delivery. Specialist in PHP frameworks (Laravel, Yii2, CodeIgniter), React/Next.js, Node.js/NestJS, and relational databases.',
  keywords: [
    'Revathi K',
    'Technical Lead',
    'Full-Stack Developer',
    'PHP',
    'Laravel',
    'CodeIgniter',
    'Yii2',
    'Next.js',
    'React',
    'Node.js',
    'NestJS',
    'MySQL',
    'PostgreSQL',
    'LiteSpark',
  ],
  authors: [{ name: 'Revathi K.' }],
  openGraph: {
    title: 'Revathi K. — Technical Lead | Full-Stack Web Development',
    description: '10+ years leading developer teams, coordinating client delivery, and building enterprise web applications.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="font-sans bg-[#07090e] text-slate-100 antialiased selection:bg-purple-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
