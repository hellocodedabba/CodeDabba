import { NavBar } from "@/components/landing/NavBar";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BlogSection } from "@/components/landing/BlogSection";
import { MentorApplicationSection } from "@/components/landing/MentorApplicationSection";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      <NavBar />

      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <BlogSection />
        <MentorApplicationSection />

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-violet-900/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto mb-10">
              Join over 10,000 students mastering full-stack development. No credit card required to start.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:scale-105 transition-all shadow-xl"
            >
              Create Free Account
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-zinc-950 py-12 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <span className="text-2xl font-bold text-white">CodeDabba</span>
              <p className="mt-4 text-zinc-500 text-sm">
                Master coding by doing. The most structured path to becoming a developer.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-white transition-colors">Courses</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Mentorship</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-sm text-zinc-600">
            © 2024 CodeDabba Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
