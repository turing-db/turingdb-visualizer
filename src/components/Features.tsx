import { Card, CardContent } from "@/components/ui/card";
import { Zap, Palette, Shield, Rocket, Code, Smartphone } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Powered by Vite's instant hot module replacement and optimized build process."
  },
  {
    icon: Palette,
    title: "Beautiful Design",
    description: "Stunning UI components built with Tailwind CSS and modern design principles."
  },
  {
    icon: Shield,
    title: "Type Safe",
    description: "Full TypeScript support for robust, error-free development experience."
  },
  {
    icon: Rocket,
    title: "Production Ready",
    description: "Optimized builds with tree-shaking, code splitting, and modern bundling."
  },
  {
    icon: Code,
    title: "Developer Experience",
    description: "Enhanced DX with hot reload, excellent debugging, and modern tooling."
  },
  {
    icon: Smartphone,
    title: "Responsive",
    description: "Mobile-first design that looks perfect on every device and screen size."
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why Choose <span className="gradient-text">Modern Vite</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the next generation of web development with cutting-edge features 
            designed for modern applications.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="glass-card hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group border-primary/10"
            >
              <CardContent className="p-8">
                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;