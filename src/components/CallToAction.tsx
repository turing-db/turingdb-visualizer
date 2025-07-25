import { Button } from "@/components/ui/button";
import { ArrowRight, Github, ExternalLink } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="glass-card p-12 md:p-16 rounded-3xl border-primary/20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Build Something
            <br />
            <span className="gradient-text">Amazing?</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already building the future with our modern tech stack.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="group px-8 py-6 text-lg shadow-lg hover:shadow-xl">
              Start Building
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-6 text-lg glass-card border-primary/20 hover:bg-primary/10"
            >
              <Github className="mr-2 w-5 h-5" />
              View Source
            </Button>
            
            <Button 
              variant="ghost" 
              size="lg" 
              className="px-8 py-6 text-lg hover:bg-primary/10"
            >
              <ExternalLink className="mr-2 w-5 h-5" />
              Live Demo
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">50k+</div>
              <div className="text-sm text-muted-foreground">Developers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;