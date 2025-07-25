import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-primary/20" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 animate-float" />
      <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-accent/30 animate-float" style={{ animationDelay: '-2s' }} />
      <div className="absolute bottom-40 left-20 w-12 h-12 rounded-full bg-primary-glow/20 animate-float" style={{ animationDelay: '-4s' }} />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Modern Vite Development</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Build the{" "}
          <span className="gradient-text">Future</span>
          <br />
          with Modern Web
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Experience lightning-fast development with Vite, React, and TypeScript. 
          Create beautiful, responsive applications with cutting-edge technology.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="group px-8 py-6 text-lg">
            Get Started
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-6 text-lg glass-card border-primary/20 hover:bg-primary/10">
            View Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;