export interface LocationData {
  provinces: Province[];
}

export interface Province {
  name: string;
  cantons: Canton[];
}

export interface Canton {
  name: string;
  parishes: string[];
}

export const ECUADOR_LOCATIONS: LocationData = {
  provinces: [
    {
      name: "Azuay",
      cantons: [
        { name: "Cuenca", parishes: ["Bellavista", "Cañaribamba", "El Batán", "Machángara", "Sayausí", "Tarqui"] },
        { name: "Gualaceo", parishes: ["Gualaceo", "Jadán", "San Juan"] },
        { name: "Paute", parishes: ["Paute", "Dug Dug", "Chicán"] }
      ]
    },
    {
      name: "Bolívar",
      cantons: [
        { name: "Guaranda", parishes: ["Ángel Polibio Chaves", "Gabriel Ignacio Veintimilla", "Guanujo"] },
        { name: "Chillanes", parishes: ["Chillanes", "San José del Tambo"] }
      ]
    },
    {
      name: "Cañar",
      cantons: [
        { name: "Azogues", parishes: ["Aurelio Bayas", "Azogues", "Cocharcas"] },
        { name: "La Troncal", parishes: ["La Troncal", "Manuel J. Calle"] }
      ]
    },
    {
      name: "Carchi",
      cantons: [
        { name: "Tulcán", parishes: ["González Suárez", "Tulcán", "Julio Andrade"] },
        { name: "Montúfar", parishes: ["San Gabriel", "La Paz"] }
      ]
    },
    {
      name: "Cotopaxi",
      cantons: [
        { name: "Latacunga", parishes: ["Eloy Alfaro", "Ignacio Flores", "Juan Montalvo"] },
        { name: "Pujilí", parishes: ["Pujilí", "Angamarca", "Guangaje"] }
      ]
    },
    {
      name: "Chimborazo",
      cantons: [
        { name: "Riobamba", parishes: ["Lizarzaburu", "Maldonado", "Velasco"] },
        { name: "Guano", parishes: ["Guano", "San Andrés"] }
      ]
    },
    {
      name: "El Oro",
      cantons: [
        { name: "Machala", parishes: ["La Providencia", "Machala", "Puerto Bolívar"] },
        { name: "Pasaje", parishes: ["Pasaje", "Buenavista"] }
      ]
    },
    {
      name: "Esmeraldas",
      cantons: [
        { name: "Esmeraldas", parishes: ["Bartolomé Ruiz", "Luis Tello", "Simón Plata"] },
        { name: "Atacames", parishes: ["Atacames", "Súa", "Tonchigüe"] }
      ]
    },
    {
      name: "Guayas",
      cantons: [
        { name: "Guayaquil", parishes: ["Tarqui", "Ximena", "Febres Cordero", "Pascuales"] },
        { name: "Durán", parishes: ["Eloy Alfaro", "El Recreo"] },
        { name: "Samborondón", parishes: ["La Puntilla", "Tarifa"] }
      ]
    },
    {
      name: "Imbabura",
      cantons: [
        { name: "Ibarra", parishes: ["Caranqui", "Sagrario", "San Francisco"] },
        { name: "Otavalo", parishes: ["Otavalo", "Peguche", "San Juan"] }
      ]
    },
    {
      name: "Loja",
      cantons: [
        { name: "Loja", parishes: ["El Sagrario", "San Sebastián", "Sucre"] },
        { name: "Catamayo", parishes: ["Catamayo", "San José"] }
      ]
    },
    {
      name: "Los Ríos",
      cantons: [
        { name: "Babahoyo", parishes: ["Clemente Baquerizo", "Dr. Camilo Ponce"] },
        { name: "Quevedo", parishes: ["Siete de Octubre", "Viva Alfaro"] }
      ]
    },
    {
      name: "Manabí",
      cantons: [
        { name: "Portoviejo", parishes: ["12 de Marzo", "Andrés de Vera"] },
        { name: "Manta", parishes: ["Los Esteros", "Tarqui", "Manta"] }
      ]
    },
    {
      name: "Morona Santiago",
      cantons: [
        { name: "Morona", parishes: ["Macas", "Sevilla Don Bosco"] },
        { name: "Gualaquiza", parishes: ["Gualaquiza", "Mercedes Molina"] }
      ]
    },
    {
      name: "Napo",
      cantons: [
        { name: "Tena", parishes: ["Tena", "Puerto Napo"] },
        { name: "Archidona", parishes: ["Archidona", "Cotundo"] }
      ]
    },
    {
      name: "Pastaza",
      cantons: [
        { name: "Pastaza", parishes: ["Puyo", "Tarqui", "Diez de Agosto"] },
        { name: "Mera", parishes: ["Mera", "Shell"] }
      ]
    },
    {
      name: "Pichincha",
      cantons: [
        { name: "Quito", parishes: ["Iñaquito", "Carcelén", "Quitumbe", "Conocoto"] },
        { name: "Rumiñahui", parishes: ["Sangolquí", "San Rafael"] }
      ]
    },
    {
      name: "Tungurahua",
      cantons: [
        { name: "Ambato", parishes: ["Atocha - Ficoa", "Huachi Chico", "Izamba"] },
        { name: "Baños", parishes: ["Baños de Agua Santa", "Río Verde"] }
      ]
    },
    {
      name: "Zamora Chinchipe",
      cantons: [
        { name: "Zamora", parishes: ["Zamora", "Cumbaratza"] },
        { name: "Yantzaza", parishes: ["Yantzaza", "Chicaña"] }
      ]
    },
    {
      name: "Galápagos",
      cantons: [
        { name: "Santa Cruz", parishes: ["Puerto Ayora", "Bellavista"] },
        { name: "San Cristóbal", parishes: ["Puerto Baquerizo Moreno", "El Progreso"] },
        { name: "Isabela", parishes: ["Puerto Villamil", "Tomás de Berlanga"] }
      ]
    },
    {
      name: "Sucumbíos",
      cantons: [
        { name: "Lago Agrio", parishes: ["Nueva Loja", "Santa Cecilia"] },
        { name: "Shushufindi", parishes: ["Shushufindi", "Siete de Julio"] }
      ]
    },
    {
      name: "Orellana",
      cantons: [
        { name: "Orellana", parishes: ["Puerto Francisco de Orellana", "Dayuma"] },
        { name: "Aguarico", parishes: ["Nuevo Rocafuerte", "Tiputini"] }
      ]
    },
    {
      name: "Santo Domingo de los Tsáchilas",
      cantons: [
        { name: "Santo Domingo", parishes: ["Abraham Calazacón", "Bombolí", "Río Verde"] },
        { name: "La Concordia", parishes: ["La Concordia", "Monterrey"] }
      ]
    },
    {
      name: "Santa Elena",
      cantons: [
        { name: "Santa Elena", parishes: ["Santa Elena", "Ballenita", "Colonche"] },
        { name: "Salinas", parishes: ["Salinas", "José Luis Tamayo"] },
        { name: "La Libertad", parishes: ["La Libertad"] }
      ]
    }
  ]
};