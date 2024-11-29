-- Table des prix Nobel
CREATE TABLE prizes (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    category TEXT NOT NULL,
    UNIQUE (year, category) -- Évite les doublons par année et catégorie
);

-- Table des lauréats
CREATE TABLE laureates (
    id SERIAL PRIMARY KEY,
    firstname TEXT NOT NULL,
    surname TEXT,
    UNIQUE (firstname, surname) -- Évite les doublons de lauréats
);

CREATE TABLE prize_laureates (
    id SERIAL PRIMARY KEY,
    prize_id INT NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
    laureate_id INT NOT NULL REFERENCES laureates(id) ON DELETE CASCADE,
    motivation TEXT,
    share INT
);
