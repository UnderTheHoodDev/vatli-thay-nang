import Header from '@/components/features/home/Header';
import Hero from '@/components/features/home/Hero';
import Teacher from '@/components/features/home/Teacher';
import Courses from '@/components/features/home/Courses';
import Schedule from '@/components/features/home/Schedule';
import Contact from '@/components/features/home/Contact';
import Footer from '@/components/features/home/Footer';
import { getCurrentSession } from '@/lib/server/session';
import { listPublicCourses } from '@/actions/v1/courses/list-public-courses';
import { getScheduleSettings } from '@/actions/v1/schedule-settings/get-schedule-settings';

export default async function Home() {
  const [session, { courses, upcoming }, scheduleSettings] = await Promise.all([
    getCurrentSession(),
    listPublicCourses(12),
    getScheduleSettings(),
  ]);
  return (
    <>
      <Header role={session?.role ?? null} />
      <Hero />
      <Teacher />
      <Courses courses={courses} upcoming={upcoming} />
      <Schedule
        academicYearFrom={scheduleSettings?.academicYearFrom}
        academicYearTo={scheduleSettings?.academicYearTo}
        imageUrl={scheduleSettings?.imageUrl}
      />
      <Contact />
      <Footer />
    </>
  );
}
