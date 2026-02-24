import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Zap, VolumeX, Shield, Wrench, Star, ArrowRight, CheckCircle } from "lucide-react";
import { products, whyChooseUs, testimonials } from "@/data/mockData";
import heroBg from "@/assets/hero-bg.jpg";
import productSlidingWindow from "@/assets/product-sliding-window.jpg";
import productCasementWindow from "@/assets/product-casement-window.jpg";
import productSlidingDoor from "@/assets/product-sliding-door.jpg";
import productTiltTurn from "@/assets/product-tilt-turn.jpg";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const iconMap: Record<string, any> = { Zap, VolumeX, Shield, Wrench };

const productImages: Record<string, string> = {
  "UPVC Sliding Windows": productSlidingWindow,
  "UPVC Casement Windows": productCasementWindow,
  "UPVC Sliding Doors": productSlidingDoor,
  "UPVC Tilt & Turn Windows": productTiltTurn,
};

const Index = () => {
  const autoplayPlugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    loadCompletedProjects();
  }, []);

  const loadCompletedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("completed_projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setCompletedProjects(data || []);
    } catch (error) {
      console.error("Error loading completed projects:", error);
      // Only show empty state, no mock data
      setCompletedProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Modern building facade" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <div className="container relative z-10 py-20">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-foreground leading-tight mb-4">
              Premium UPVC Windows & Doors Solutions
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8">
              MIM Enterprises – Authorised Partner of Prominance UPVC Doors & Windows
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/contact">
                <Button size="lg" className="text-base px-8">
                  Get Free Quote <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="text-base px-8 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/20">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Products Carousel */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">Our Products</h2>
          <div className="h-1 w-16 bg-primary rounded-full mx-auto mb-12" />
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[autoplayPlugin.current]}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent className="-ml-4">
              {products.map((product) => (
                <CarouselItem key={product.name} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card className="hover-lift border-border/50 bg-card overflow-hidden">
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={productImages[product.name]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                      <span className="absolute bottom-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        {product.name.includes("Door") ? "Doors" : "Windows"}
                      </span>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-heading font-semibold text-lg mb-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 md:-left-12" />
            <CarouselNext className="-right-4 md:-right-12" />
          </Carousel>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-primary">
        <div className="container">
          <h2 className="text-3xl font-heading font-bold text-center mb-4 text-primary-foreground">Why Choose Us</h2>
          <div className="h-1 w-16 bg-primary-foreground/30 rounded-full mx-auto mb-12" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <div key={item.title} className="text-center p-6 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
                  <div className="h-14 w-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-primary-foreground">{item.title}</h3>
                  <p className="text-sm text-primary-foreground/70">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Completed Projects */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">Completed Projects</h2>
          <div className="h-1 w-16 bg-primary rounded-full mx-auto mb-12" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingProjects ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            ) : completedProjects.length > 0 ? (
              completedProjects.map((project) => (
                <Card key={project.id} className="hover-lift overflow-hidden">
                  {project.image_url && (
                    <div className="h-40 overflow-hidden bg-muted">
                      <img
                        src={project.image_url}
                        alt={project.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="font-heading font-semibold mb-2 line-clamp-2">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.location} • {project.sqft} sqft</p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{project.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center py-12">
                <p className="text-muted-foreground">No completed projects yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-card">
        <div className="container">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">Client Testimonials</h2>
          <div className="h-1 w-16 bg-primary rounded-full mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}
                  </div>
                  <p className="text-muted-foreground text-sm mb-4 italic">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 bg-card">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl font-heading font-bold mb-4 text-foreground">About MIM Enterprises</h2>
          <div className="h-1 w-16 bg-primary rounded-full mx-auto mb-6" />
          <p className="text-muted-foreground leading-relaxed text-lg">
            MIM Enterprises is a trusted name in the UPVC doors and windows industry, serving as an authorised partner of Prominance UPVC. 
            With years of experience and a commitment to quality, we deliver premium fenestration solutions that combine durability, 
            energy efficiency, and aesthetic elegance. Our professional team ensures every project is completed to the highest standards, 
            earning the trust of homeowners, builders, and architects across the country.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h2 className="text-3xl font-heading font-bold text-primary-foreground mb-4">
            Get Your Free Site Visit Today
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            Our experts will visit your site, take measurements, and provide a detailed quotation — completely free.
          </p>
          <Link to="/contact">
            <Button size="lg" variant="secondary" className="text-base px-8">
              Schedule Free Visit <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
