import { useRestaurantData } from '../../hooks/useRestaurantData';

export function AboutPage() {
  const { config } = useRestaurantData();
  return (
    <section className="py-16">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Sobre</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Uma narrativa institucional editavel.</h1>
          <p className="mt-5 text-lg leading-8 text-ink/68">{config.institutionalText}</p>
          <p className="mt-6 leading-7 text-ink/62">Este template foi criado para acomodar restaurantes familiares, pizzarias, steak houses, cozinhas japonesas, bistros e operacoes executivas sem perder consistencia visual.</p>
        </div>
        <img src={config.aboutImage} alt="Equipe e salao" className="aspect-[4/3] rounded-lg object-cover shadow-soft" />
      </div>
    </section>
  );
}
