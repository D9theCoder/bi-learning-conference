import FeaturesBento from '@/components/landing/features-bento';
import HeroSection from '@/components/landing/hero-section';
import LiveProgressDashboard from '@/components/landing/live-progress-dashboard';
import TestimonialsMarquee from '@/components/landing/testimonials-marquee';
import { Button } from '@/components/ui/button';
import RevealOnScroll from '@/components/ui/reveal-on-scroll';
import { dashboard, login, register } from '@/routes';
import { SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Lenis from 'lenis';
import { ArrowRight, LayoutDashboard, LogIn } from 'lucide-react';
import { useEffect } from 'react';

export default function Welcome() {
  const { auth } = usePage<SharedData>().props;

  useEffect(() => {
    const lenisInstance = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    function raf(time: number) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenisInstance.destroy();
    };
  }, []);

  const handleStart = () => {
    router.visit(register());
  };

  return (
    <>
      <Head title="Welcome to Bi-Learning" />

      <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-emerald-500/30">
        {/* Navigation Overlay */}
        <header className="fixed top-0 z-50 w-full border-b border-border/5 bg-background/60 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
              <img
                src="/bilearning-logo.png"
                alt="Bi-Learning Logo"
                className="h-12 w-auto"
              />
              <span className="hidden sm:inline">Bi-Learning</span>
            </div>

            <nav className="flex items-center gap-4">
              {auth.user ? (
                <Link href={dashboard()}>
                  <Button variant="ghost" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={login()}>
                    <Button variant="ghost" className="hidden sm:flex">
                      Log in
                    </Button>
                  </Link>
                  <Link href={register()}>
                    <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="relative">
          <HeroSection onStart={handleStart} />

          <RevealOnScroll width="100%">
            <FeaturesBento />
          </RevealOnScroll>

          <RevealOnScroll width="100%">
            <LiveProgressDashboard />
          </RevealOnScroll>

          <RevealOnScroll width="100%">
            <TestimonialsMarquee />
          </RevealOnScroll>

          {/* Final CTA */}
          <RevealOnScroll width="100%">
            <section className="relative overflow-hidden py-32 text-center">
              <div className="absolute inset-0 z-0 bg-emerald-600" />
              <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

              <div className="relative z-10 container mx-auto px-4 text-white">
                <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Ready to level up?
                </h2>
                <p className="mb-10 text-lg opacity-90 md:text-xl">
                  Join the community today and start your journey.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href={register()}>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="h-14 px-8 text-lg text-emerald-700"
                    >
                      Create Free Account
                    </Button>
                  </Link>
                  <Link href={login()}>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-14 border-white/20 bg-white/10 px-8 text-lg text-white hover:bg-white/20 hover:text-white"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </RevealOnScroll>
        </main>

        <footer className="border-t border-border bg-muted/20 py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-4 flex justify-center">
              <img
                src="/bilearning-logo.png"
                alt="Bi-Learning Logo"
                className="h-16 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Bi-Learning. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
