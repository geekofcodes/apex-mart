import { motion } from "framer-motion";
import { ShieldCheck, Truck, Clock, Heart, Users, MapPin } from "lucide-react";

const About = () => {
  const stats = [
    { label: "Founded", value: "2023", icon: Clock },
    { label: "Community", value: "10K+", icon: Users },
    { label: "Locations", value: "全球", icon: MapPin },
    { label: "Happiness", value: "99%", icon: Heart },
  ];

  return (
    <div className="bg-(--color-background)">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-linear-to-br from-blue-900 to-blue-700 text-white">
        <div className="container-custom relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold mb-6"
          >
            About ApexMart
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-blue-100 max-w-3xl mx-auto"
          >
            Redefining the premium e-commerce experience with curated selections
            and uncompromising quality.
          </motion.p>
        </div>
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[80%] bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[100%] bg-blue-400 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-(--color-border)">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3">
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-(--color-text-primary)">
                  {stat.value}
                </h3>
                <p className="text-sm text-(--color-text-muted)">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-4 block">
                Our Mission
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-(--color-text-primary) mb-6 leading-tight">
                Empowering your lifestyle through excellence and innovation.
              </h2>
              <p className="text-(--color-text-muted) text-lg mb-8 leading-relaxed">
                At ApexMart, we believe that shopping should be more than just a
                transaction. It should be an exploration of quality and a
                celebration of choice. We aggregate the world's finest products
                into a single, seamless destination.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex-shrink-0 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-(--color-text-primary)">
                      Verified Authenticity
                    </h4>
                    <p className="text-sm text-(--color-text-muted)">
                      Every product is rigorous inspected for quality and brand
                      integrity.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-(--color-text-primary)">
                      Global Logistics
                    </h4>
                    <p className="text-sm text-(--color-text-muted)">
                      Reliable, fast, and secure delivery to your doorstep,
                      anywhere.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200"
                alt="Our Team"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values/Features */}
      <section className="py-20 bg-(--color-background-alt)">
        <div className="container-custom text-center mb-16">
          <h2 className="text-3xl font-bold text-(--color-text-primary)">
            The ApexMart Promise
          </h2>
          <p className="text-(--color-text-muted) max-w-2xl mx-auto mt-4">
            We stand behind every product and every customer interaction.
          </p>
        </div>
        <div className="container-custom grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center p-8 hover-lift">
            <h3 className="text-xl font-bold mb-3">Customer First</h3>
            <p className="text-sm text-(--color-text-muted)">
              Our dedicated support team is available 24/7 to ensure your
              satisfaction.
            </p>
          </div>
          <div className="card text-center p-8 hover-lift">
            <h3 className="text-xl font-bold mb-3">Sustainability</h3>
            <p className="text-sm text-(--color-text-muted)">
              We partner with eco-conscious brands to reduce our environmental
              footprint.
            </p>
          </div>
          <div className="card text-center p-8 hover-lift">
            <h3 className="text-xl font-bold mb-3">Innovation</h3>
            <p className="text-sm text-(--color-text-muted)">
              Continuously improving our platform to provide a faster, smarter
              experience.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
