import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, Clock } from "lucide-react";

const Home = () => {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative bg-(--color-hero-bg) text-white overflow-hidden rounded-3xl mx-4 lg:mx-0">
        <div className="absolute inset-0 bg-linear-to-r from-blue-900/60 to-purple-900/60 z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2689&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />

        <div className="relative z-10 container-custom py-24 md:py-32 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight animate-fade-in">
            Welcome to{" "}
            <span className="text-(--color-border-highlight)">ApexMart</span>
          </h1>
          <p
            className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Your premium destination for high-quality products. Discover the
            latest trends in electronics, fashion, and lifestyle.
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              to="/products"
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/about"
              className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Quality Products",
              desc: "Discover our curated selection of premium products",
            },
            {
              icon: Truck,
              title: "Fast Shipping",
              desc: "Get your orders delivered quickly and safely",
            },
            {
              icon: Clock,
              title: "24/7 Support",
              desc: "Our team is always here to help you",
            },
          ].map((feature, idx) => (
            <div key={idx} className="card hover-lift border-(--color-border)">
              <div className="w-12 h-12 bg-(--color-primary-light) text-(--color-primary) rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-(--color-text-primary) mb-2">
                {feature.title}
              </h3>
              <p className="text-(--color-text-muted) text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories Preview (Placeholder) */}
      <section className="container-custom">
        <h2 className="text-2xl font-bold text-(--color-text-primary) mb-6">
          Trending Now
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="aspect-4/5 bg-(--color-background-alt) rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
