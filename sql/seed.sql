-- ============================================
-- Manga Base API - Dados Iniciais (Seed)
-- ============================================

USE manga_base_db;

-- ============================================
-- Inserir Usuários (senha: 123456 hasheada com SHA256)
-- SHA256 de '123456': 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
-- ============================================
INSERT INTO usuarios (nome, email, nome_usuario, senha) VALUES
    ('Administrador', 'admin@mangabase.com', 'admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'),
    ('Carlos Manga', 'carlos@mangabase.com', 'carlos_manga', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'),
    ('Maria Leitora', 'maria@mangabase.com', 'maria_leitora', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');

-- ============================================
-- Inserir Gêneros
-- ============================================
INSERT INTO generos (nome, descricao) VALUES
    ('Ação', 'Cenas de luta, combate e aventura intensa'),
    ('Aventura', 'Jornadas, exploração e descobertas'),
    ('Comédia', 'Humor, situações engraçadas e comédia'),
    ('Drama', 'Conflitos emocionais, histórias profundas'),
    ('Fantasia', 'Mundos mágicos, poderes sobrenaturais'),
    ('Ficção Científica', 'Tecnologia, futuro, espacial'),
    ('Horror', 'Terror, suspense, sobrenatural'),
    ('Mistério', 'Mistérios, investigação, suspense'),
    ('Romance', 'Relacionamentos amorosos, XVIII'),
    ('Slice of Life', 'Vida cotidiana, rotina, cotidiano'),
    ('Sobrenatural', 'Fantasmas, demônios, poderes místicos'),
    ('Esportes', 'Competições esportivas, treinos'),
    ('Mecha', 'Robôs gigantes, tecnologia militar'),
    ('Psicológico', 'Questões mentais, filosofia, existencialismo'),
    ('Seinen', 'Público adulto masculino (+18)'),
    ('Shonen', 'Público jovem masculino'),
    ('Shojo', 'Público jovem feminino'),
    ('Josei', 'Público adulto feminino'),
    ('Harem', 'Protagonista com múltiplos pretendentes'),
    ('Isekai', 'Transportado para outro mundo');

-- ============================================
-- Inserir Autores
-- ============================================
INSERT INTO autores (nome, nome_japones, nacionalidade, biografia) VALUES
    ('Eiichiro Oda', '尾田栄一郎', 'Japonês', 'Criador de One Piece, um dos mangás mais vendidos da história.'),
    ('Masashi Kishimoto', '岸本斉史', 'Japonês', 'Criador de Naruto, série extremamente popular mundialmente.'),
    ('Kohei Horikoshi', '堀越耕平', 'Japonês', 'Criador de My Hero Academia, sucesso global.'),
    ('Yusuke Murata', '村田雄介', 'Japonês', 'Ilustrador de One Punch-Man e Eyeshield 21.'),
    ('Geon-goo Kim', '김건구', 'Coreano', 'Autor de Solo Leveling, manhwa de sucesso.'),
    ('Chugong', '추공', 'Coreano', 'Criador da novel original de Solo Leveling.'),
    ('Hajime Isayama', '諫山創', 'Japonês', 'Criador de Attack on Titan, fenômeno mundial.'),
    ('Kentaro Miura', '三浦建太郎', 'Japonês', 'Criador de Berserk, obra-prima do dark fantasy.'),
    ('Tsukasa Hojo', '和月伸宏', 'Japonês', 'Criador de City Hunter e Crows Zero.'),
    ('Takehiko Inoue', '井上雄彦', 'Japonês', 'Criador de Slam Dunk e Vagabond, mestre do desenho.');

-- ============================================
-- Inserir Mangás
-- ============================================
INSERT INTO mangas (titulo, tipo, autor, editora, sinopse, ano_lancamento, status, volumetoria, genero, classificacao_etaria, url_capa) VALUES
    ('One Piece', 'manga', 'Eiichiro Oda', 'Shueisha',
     'Monkey D. Luffy sonha em se tornar o Rei dos Piratas. Para isso, ele precisa encontrar o lendário tesouro One Piece. Com seu chapéu de palha e sua tripulação, Luffy enfrenta inimigos poderosos e explora misteriosos mares.',
     1997, 'em_andamento', '107+ volumes', 'Ação, Aventura, Comédia, Shonen', '12',
     'https://m.media-amazon.com/images/I/716EGgqzyOL.jpg'),
    
    ('Naruto', 'manga', 'Masashi Kishimoto', 'Shueisha',
     'Naruto Uzumaki é um jovem ninja rejeitado por sua vila que busca reconhecimento e se torna o maior ninja de sua geração. Uma história de amizade, superação e redenção.',
     1999, 'completo', '72 volumes', 'Ação, Aventura, Shonen', '12',
     'https://upload.wikimedia.org/wikipedia/pt/d/d2/Naruto_vol._01.jpg'),
    
    ('My Hero Academia', 'manga', 'Kohei Horikoshi', 'Shueisha',
     'Em um mundo onde 80% da população possui superpoderes, Izuku Midoriya nasceu sem habilidades mas sonha em se tornar um herói. Após encontrar o maior herói do mundo, ele recebe um poder que mudará sua vida.',
     2014, 'completo', '40 volumes', 'Ação, Shonen, Super-herói', '12',
     'https://example.com/covers/mha.jpg'),
    
    ('Solo Leveling', 'manhwa', 'Geon-goo Kim / Chugong', 'D&C Media',
     'Sung Jin-Woo é o caçador mais fraco da humanidade. Após um incidente em uma masmorra, ele ganha a habilidade de subir de nível sozinho, transformando-se no ser mais poderoso do mundo.',
     2018, 'completo', '200 capítulos', 'Ação, Aventura, Fantasia', '16',
     'https://example.com/covers/solo-leveling.jpg'),
    
    ('Attack on Titan', 'manga', 'Hajime Isayama', 'Kodansha',
     'A humanidade vive cercada por muralhas para se proteger dos Titãs, criaturas humanoides gigantes que devoram pessoas. Eren Yeager jura exterminar todos os Titãs após a destruição de sua cidade natal.',
     2009, 'completo', '34 volumes', 'Ação, Drama, Psicológico, Shonen', '16',
     'https://example.com/covers/aot.jpg'),
    
    ('Berserk', 'manga', 'Kentaro Miura', 'Hakusensha',
     'Guts, o Espadachim Negro, é um guerreiro solitário que busca vingança contra seu melhor amigo que o traiu. Uma épica de dark fantasy com temas maduros e violência gráfica.',
     1989, 'em_andamento', '42 volumes', 'Ação, Fantasia, Horror, Seinen', '18',
     'https://example.com/covers/berserk.jpg'),
    
    ('City Hunter', 'manga', 'Tsukasa Hojo', 'Shueisha',
     'Ryo Saeba é um "Sweeper" em Tóquio, um freelancer que resolve problemas usando suas habilidades de combate. Com humor e ação, ele protege os inocentes e pune os criminosos.',
     1985, 'completo', '35 volumes', 'Ação, Comédia, Shonen', '14',
     'https://example.com/covers/city-hunter.jpg'),
    
    ('Slam Dunk', 'manga', 'Takehiko Inoue', 'Shueisha',
     'Hanamichi Sakuragi, um delinquente apavorado por meninas, entra no time de basquete apenas para impressionar uma garota. Porém, acaba descobrindo uma paixão pelo esporte.',
     1990, 'completo', '31 volumes', 'Esportes, Comédia, Shonen', '10',
     'https://example.com/covers/slam-dunk.jpg'),
    
    ('Omniscient Reader', 'manhwa', 'Umi / Sleepy-C', 'Naver',
     'Kim Dokja é o único leitor de um web novel apocalíptico. Quando o mundo se transforma na história que ele leu, seus conhecimentos se tornam sua maior arma para sobreviver.',
     2020, 'em_andamento', '250+ capítulos', 'Ação, Fantasia, Psicológico', '16',
     'https://example.com/covers/omniscient-reader.jpg'),
    
    ('Turma da Mônica', 'gibi', 'Mauricio de Sousa', 'Editora Mauricio de Sousa',
     'As aventuras da Mônica, Cebolinha, Cascão, Magali e Franjinha no bairro do Limoeiro. HQ brasileira clássica e querida por todas as gerações.',
     1963, 'em_andamento', 'Milhares de edições', 'Comédia, Slice of Life', 'L',
     'https://example.com/covers/monica.jpg');

-- ============================================
-- Inserir Capítulos de Exemplo
-- ============================================
INSERT INTO capitulos (manga_id, numero, titulo, data_lancamento) VALUES
    (1, '1', 'Romance Dawn', '1997-07-22'),
    (1, '2', 'O homem que chamaram de Vilão', '1997-08-04'),
    (1, '3', 'Morgan vs Luffy', '1997-08-18'),
    (2, '1', 'Naruto Uzumaki!', '1999-09-21'),
    (2, '2', 'Konohamaru!', '1999-09-27'),
    (4, '1', 'Regressão', '2018-03-04'),
    (4, '2', 'O Sistema', '2018-03-11'),
    (5, '1', 'A Queda', '2009-09-09'),
    (5, '2', 'A Chuva de Nove Dias', '2009-09-23'),
    (10, '1', 'Monica e o Saci', '1963-06-18');
