import axios from 'axios';
import { TMDbMovie, TMDbTv } from 'src/metadata/provider/tmdb';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

import movieSearchResponse from './mock/tmdb/movieSearchResponse.json';
import movieDetailsResponse from './mock/tmdb/movieDetailsResponse.json';
import tvSearchResponse from './mock/tmdb/tvSearchResponse.json';
import tvDetailsResponse from './mock/tmdb/tvDetailsResponse.json';
import seasonsResponse from './mock/tmdb/seasonsResponse.json';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const tmdbMovie = new TMDbMovie();
const tmdbTv = new TMDbTv();

describe('TMDb', () => {
  beforeAll(runMigrations);
  afterAll(clearDatabase);

  test('TMDbMovie search', async () => {
    mockedAxios.get.mockResolvedValue({
      data: movieSearchResponse,
      status: 200,
    });
    const res = await tmdbMovie.search('Harry Potter');
    expect(res).toStrictEqual(movieSearchResult);
  });

  test('TMDbMovie details', async () => {
    mockedAxios.get.mockResolvedValue({
      data: movieDetailsResponse,
      status: 200,
    });
    const res = await tmdbMovie.details({
      tmdbId: 671,
    });

    expect(res).toStrictEqual(movieDetailsResult);
  });

  test('TMDbTv search', async () => {
    mockedAxios.get.mockResolvedValue({ data: tvSearchResponse, status: 200 });
    const res = await tmdbTv.search('Lost');
    expect(res).toStrictEqual(tvSearchResult);
  });

  test('TMDbTv details', async () => {
    mockedAxios.get.mockImplementation(async (url) => {
      if (url === 'https://api.themoviedb.org/3/tv/4607') {
        return { data: tvDetailsResponse };
      }

      if (url === 'https://api.themoviedb.org/3/tv/4607/season/0') {
        return { data: seasonsResponse[0] };
      }

      if (url === 'https://api.themoviedb.org/3/tv/4607/season/1') {
        return { data: seasonsResponse[1] };
      }

      if (url === 'https://api.themoviedb.org/3/tv/4607/season/2') {
        return { data: seasonsResponse[2] };
      }

      if (url === 'https://api.themoviedb.org/3/tv/4607/season/3') {
        return { data: seasonsResponse[3] };
      }

      if (url === 'https://api.themoviedb.org/3/tv/4607/season/4') {
        return { data: seasonsResponse[4] };
      }

      if (url === 'https://api.themoviedb.org/3/tv/4607/season/5') {
        return { data: seasonsResponse[5] };
      }

      if (url === 'https://api.themoviedb.org/3/tv/4607/season/6') {
        return { data: seasonsResponse[6] };
      }
    });

    const res = await tmdbTv.details({
      tmdbId: 4607,
    });

    expect(res).toStrictEqual(tvDetailsResult);
  });
});

const movieDetailsResult = {
  source: 'tmdb',
  mediaType: 'movie',
  title: "Harry Potter and the Philosopher's Stone",
  backdrop:
    'https://image.tmdb.org/t/p/original/5jkE2SzR5uR2egEb1rRhF22JyWN.jpg',
  poster: 'https://image.tmdb.org/t/p/original/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg',
  tmdbId: 671,
  overview:
    "Harry Potter has lived under the stairs at his aunt and uncle's house his whole life. But on his 11th birthday, he learns he's a powerful wizard—with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry. As he learns to harness his newfound powers with the help of the school's kindly headmaster, Harry uncovers the truth about his parents' deaths—and about the villain who's to blame.",
  status: 'Released',
  url: 'https://www.warnerbros.com/movies/harry-potter-and-sorcerers-stone/',
  genres: ['Adventure', 'Fantasy'],
  imdbId: 'tt0241527',
  originalTitle: "Harry Potter and the Philosopher's Stone",
  releaseDate: '2001-11-16',
  runtime: 152,
  tmdbRating: 7.9,
  needsDetails: false,
};

const movieSearchResult = [
  {
    source: 'tmdb',
    mediaType: 'movie',
    title: "Harry Potter and the Philosopher's Stone",
    backdrop:
      'https://image.tmdb.org/t/p/original/5jkE2SzR5uR2egEb1rRhF22JyWN.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg',
    tmdbId: 671,
    overview:
      "Harry Potter has lived under the stairs at his aunt and uncle's house his whole life. But on his 11th birthday, he learns he's a powerful wizard—with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry. As he learns to harness his newfound powers with the help of the school's kindly headmaster, Harry uncovers the truth about his parents' deaths—and about the villain who's to blame.",
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: "Harry Potter and the Philosopher's Stone",
    releaseDate: '2001-11-16',
    runtime: undefined,
    tmdbRating: 7.9,
    needsDetails: true,
  },
  {
    source: 'tmdb',
    mediaType: 'movie',
    title: 'Harry Potter and the Half-Blood Prince',
    backdrop:
      'https://image.tmdb.org/t/p/original/urDWNffjwmNi5IQaezw9GwqkUXa.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/o2j49x3HYJC2VH689rYxmswtSgS.jpg',
    tmdbId: 767,
    overview:
      'As Lord Voldemort tightens his grip on both the Muggle and wizarding worlds, Hogwarts is no longer a safe haven. Harry suspects perils may even lie within the castle, but Dumbledore is more intent upon preparing him for the final battle fast approaching. Together they work to find the key to unlock Voldemorts defenses and to this end, Dumbledore recruits his old friend and colleague Horace Slughorn, whom he believes holds crucial information. Even as the decisive showdown looms, romance blossoms for Harry, Ron, Hermione and their classmates. Love is in the air, but danger lies ahead and Hogwarts may never be the same again.',
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: 'Harry Potter and the Half-Blood Prince',
    releaseDate: '2009-07-07',
    runtime: undefined,
    tmdbRating: 7.7,
    needsDetails: true,
  },
  {
    source: 'tmdb',
    mediaType: 'movie',
    title: 'Harry Potter and the Goblet of Fire',
    backdrop:
      'https://image.tmdb.org/t/p/original/5rrGVmRUuCKVbqUu41XIWTXJmNA.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/fECBtHlr0RB3foNHDiCBXeg9Bv9.jpg',
    tmdbId: 674,
    overview:
      "When Harry Potter's name emerges from the Goblet of Fire, he becomes a competitor in a grueling battle for glory among three wizarding schools—the Triwizard Tournament. But since Harry never submitted his name for the Tournament, who did? Now Harry must confront a deadly dragon, fierce water demons and an enchanted maze only to find himself in the cruel grasp of He Who Must Not Be Named.",
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: 'Harry Potter and the Goblet of Fire',
    releaseDate: '2005-11-16',
    runtime: undefined,
    tmdbRating: 7.8,
    needsDetails: true,
  },
  {
    source: 'tmdb',
    mediaType: 'movie',
    title: 'Harry Potter and the Chamber of Secrets',
    backdrop:
      'https://image.tmdb.org/t/p/original/1stUIsjawROZxjiCMtqqXqgfZWC.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/sdEOH0992YZ0QSxgXNIGLq1ToUi.jpg',
    tmdbId: 672,
    overview:
      'Cars fly, trees fight back, and a mysterious house-elf comes to warn Harry Potter at the start of his second year at Hogwarts. Adventure and danger await when bloody writing on a wall announces: The Chamber Of Secrets Has Been Opened. To save Hogwarts will require all of Harry, Ron and Hermione’s magical abilities and courage.',
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: 'Harry Potter and the Chamber of Secrets',
    releaseDate: '2002-11-13',
    runtime: undefined,
    tmdbRating: 7.7,
    needsDetails: true,
  },
  {
    source: 'tmdb',
    mediaType: 'movie',
    title: 'Harry Potter and the Prisoner of Azkaban',
    backdrop:
      'https://image.tmdb.org/t/p/original/vbk5CfaAHOjQPSAcYm6AoRRz2Af.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/aWxwnYoe8p2d2fcxOqtvAtJ72Rw.jpg',
    tmdbId: 673,
    overview:
      'Year three at Hogwarts means new fun and challenges as Harry learns the delicate art of approaching a Hippogriff, transforming shape-shifting Boggarts into hilarity and even turning back time. But the term also brings danger: soul-sucking Dementors hover over the school, an ally of the accursed He-Who-Cannot-Be-Named lurks within the castle walls, and fearsome wizard Sirius Black escapes Azkaban. And Harry will confront them all.',
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: 'Harry Potter and the Prisoner of Azkaban',
    releaseDate: '2004-05-31',
    runtime: undefined,
    tmdbRating: 8,
    needsDetails: true,
  },
] as unknown;

const tvSearchResult = [
  {
    source: 'tmdb',
    mediaType: 'tv',
    title: 'Lost',
    backdrop:
      'https://image.tmdb.org/t/p/original/12NEw3eBUQxK9qdgtegZRsz4Yp8.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/og6S0aTZU6YUJAbqxeKjCa3kY1E.jpg',
    tmdbId: 4607,
    overview:
      'Stripped of everything, the survivors of a horrific plane crash  must work together to stay alive. But the island holds many secrets.',
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: 'Lost',
    releaseDate: '2004-09-22',
    numberOfSeasons: undefined,
    tmdbRating: 7.9,
    network: undefined,
    runtime: undefined,
    seasons: undefined,
    needsDetails: true,
  },
  {
    source: 'tmdb',
    mediaType: 'tv',
    title: "Dan Brown's The Lost Symbol",
    backdrop:
      'https://image.tmdb.org/t/p/original/hZ9MlxA80rLGh5OExoJEeIEBByD.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/rc99fLHeOH4QBROUzAyPeKCvt6T.jpg',
    tmdbId: 120452,
    overview:
      'The early adventures of young Harvard symbologist Robert Langdon, who must solve a series of deadly puzzles to save his kidnapped mentor and thwart a chilling global conspiracy.',
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: "Dan Brown's The Lost Symbol",
    releaseDate: '2021-09-16',
    numberOfSeasons: undefined,
    tmdbRating: 7.7,
    network: undefined,
    runtime: undefined,
    seasons: undefined,
    needsDetails: true,
  },
  {
    source: 'tmdb',
    mediaType: 'tv',
    title: 'Lost Girl',
    backdrop:
      'https://image.tmdb.org/t/p/original/9jlwGGx9zTkEV5mnuyQXDTUMCw3.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/jE6sqorxIyVU55VhDbz7NbqxZlV.jpg',
    tmdbId: 33852,
    overview:
      'The gorgeous and charismatic Bo is a supernatural being called a succubus who feeds on the energy of humans, sometimes with fatal results. Refusing to embrace her supernatural clan and its rigid hierarchy, Bo is a renegade who takes up the fight for the underdog while searching for the truth about her own mysterious origins.',
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: 'Lost Girl',
    releaseDate: '2010-09-12',
    numberOfSeasons: undefined,
    tmdbRating: 7.8,
    network: undefined,
    runtime: undefined,
    seasons: undefined,
    needsDetails: true,
  },
  {
    source: 'tmdb',
    mediaType: 'tv',
    title: 'Lost in Space',
    backdrop:
      'https://image.tmdb.org/t/p/original/nB8Z2lDOOSpZgTRLUVYSJ74RPof.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/y8NJnTXzb4rio9uvVYFVrXEMofU.jpg',
    tmdbId: 75758,
    overview:
      "After crash-landing on an alien planet, the Robinson family fights against all odds to survive and escape. But they're surrounded by hidden dangers.",
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: 'Lost in Space',
    releaseDate: '2018-04-13',
    numberOfSeasons: undefined,
    tmdbRating: 7.7,
    network: undefined,
    runtime: undefined,
    seasons: undefined,
    needsDetails: true,
  },
  {
    source: 'tmdb',
    mediaType: 'tv',
    title: 'Lost in Space',
    backdrop:
      'https://image.tmdb.org/t/p/original/fyrAObqU9IBWTu6CwRx7fwA7pFV.jpg',
    poster:
      'https://image.tmdb.org/t/p/original/dGhtCpYZutuso2P3GKWnQnqwhSi.jpg',
    tmdbId: 3051,
    overview:
      "The space family Robinson is sent on a five-year mission to find a new planet to colonise. The voyage is sabotaged time and again by an inept stowaway, Dr. Zachary Smith. The family's spaceship, Jupiter II, also carries a friendly robot who endures an endless stream of abuse from Dr. Smith, but is a trusted companion of young Will Robinson",
    status: null,
    url: null,
    genres: undefined,
    imdbId: undefined,
    originalTitle: 'Lost in Space',
    releaseDate: '1965-09-15',
    numberOfSeasons: undefined,
    tmdbRating: 7.2,
    network: undefined,
    runtime: undefined,
    seasons: undefined,
    needsDetails: true,
  },
] as unknown;

const tvDetailsResult = {
  source: 'tmdb',
  mediaType: 'tv',
  title: 'Lost',
  backdrop:
    'https://image.tmdb.org/t/p/original/12NEw3eBUQxK9qdgtegZRsz4Yp8.jpg',
  poster: 'https://image.tmdb.org/t/p/original/og6S0aTZU6YUJAbqxeKjCa3kY1E.jpg',
  tmdbId: 4607,
  overview:
    'Stripped of everything, the survivors of a horrific plane crash  must work together to stay alive. But the island holds many secrets.',
  status: 'Ended',
  url: 'http://abc.go.com/shows/lost',
  genres: ['Action & Adventure', 'Mystery'],
  imdbId: 'tt0411008',
  originalTitle: 'Lost',
  releaseDate: '2004-09-22',
  numberOfSeasons: 6,
  tmdbRating: 7.9,
  network: 'ABC',
  runtime: 45,
  seasons: [
    {
      tmdbId: 14047,
      title: 'Specials',
      description: null,
      poster:
        'https://image.tmdb.org/t/p/original/u1hvfXTqebq6Na5zhzHiJYZT0YK.jpg',
      seasonNumber: 0,
      numberOfEpisodes: 33,
      releaseDate: '2005-04-27',
      isSpecialSeason: true,
      episodes: [
        {
          title: 'The Journey',
          description:
            'Flashbacks of the core characters illustrating who they were and what they were doing before the crash, a look at the island itself, and a preview of the big season finale.',
          episodeNumber: 1,
          seasonNumber: 0,
          releaseDate: '2005-04-27',
          isSpecialEpisode: true,
          tmdbId: 334044,
        },
        {
          title: 'Destination Lost',
          description:
            'Narrated in a linear fashion and culminating from the pieces of the back stories told over multiple episodes in the series, "Destination Lost" focuses on the flashbacks of a core of characters -- illustrating who they were and what they were doing before the crash, and how the island has changed their lives, for better or worse. In addition, the island itself will be explored - culled from events that have taken place - which may reveal some of its secrets that might have been missed upon first viewing.',
          episodeNumber: 2,
          seasonNumber: 0,
          releaseDate: '2005-09-21',
          isSpecialEpisode: true,
          tmdbId: 334045,
        },
        {
          title: 'Revelations',
          description:
            'Discover the complete story of the grueling first 48 days on the island for the fuselage survivors and tailies after the crash of Oceanic flight 815. Since the beginning, "Lost" has mystified and intrigued viewers with its interesting characters and unique style of storytelling. Season One dealt with the fuselage survivors, the hatch and a failed attempt to get off the island. Season Two continues these stories and also introduces viewers to the survivors of the tail section. "Lost: Revelation" puts these two seasons together in a linear fashion that provides an illuminating view on one compelling story. See the sequence of the aftermath of the failed raft attempt, the opening of the hatch, how the tail section and fuselage survivors lived separately and the unwitting intersections of their lives, and how both groups ultimately collided in one catastrophic moment. "Lost: Revelation" offers new and avid viewers a fresh perspective, comprehensive and enlightening, in one of television\'s most intriguing series.',
          episodeNumber: 3,
          seasonNumber: 0,
          releaseDate: '2006-01-11',
          isSpecialEpisode: true,
          tmdbId: 334046,
        },
        {
          title: 'Reckoning',
          description:
            'A recap special of the events up to this point in the series narrated by Peter Coyote.',
          episodeNumber: 4,
          seasonNumber: 0,
          releaseDate: '2006-04-26',
          isSpecialEpisode: true,
          tmdbId: 334047,
        },
        {
          title: 'The Lost Survival Guide',
          description:
            '"Lost" executive producers Damon Lindelof and Carlton Cuse discuss the show\'s premise and recent happenings on the series in season 2, as well as a preview for season 3.',
          episodeNumber: 5,
          seasonNumber: 0,
          releaseDate: '2006-09-02',
          isSpecialEpisode: true,
          tmdbId: 334048,
        },
        {
          title: 'A Tale Of Survival',
          description: 'Recap of the first two seasons',
          episodeNumber: 6,
          seasonNumber: 0,
          releaseDate: '2006-09-27',
          isSpecialEpisode: true,
          tmdbId: 334049,
        },
        {
          title: 'Survivor Guide',
          description: null,
          episodeNumber: 7,
          seasonNumber: 0,
          releaseDate: '2007-02-07',
          isSpecialEpisode: true,
          tmdbId: 333923,
        },
        {
          title: 'The Answers',
          description:
            'A look at the questions that have been answered and the mysteries yet to be solved for the survivors of Oceanic Flight 815.',
          episodeNumber: 8,
          seasonNumber: 0,
          releaseDate: '2007-05-17',
          isSpecialEpisode: true,
          tmdbId: 334050,
        },
        {
          title: 'Past, Present & Future',
          description:
            'When Oceanic Flight 815 crashed on an island in the middle of the Pacific, each survivor was given a choice to live together or die alone. Thrown together in this mysterious place, they have struggled to overcome shadows from their past in order to survive and answer the questions that plague their new lives on the island. Where are they? Is rescue on its way? What else is on this island? In "LOST: Past, Present & Future," relive their story of survival to prepare for the shocking season four premiere that will change everything.',
          episodeNumber: 9,
          seasonNumber: 0,
          releaseDate: '2008-01-31',
          isSpecialEpisode: true,
          tmdbId: 334051,
        },
        {
          title: 'Destiny Calls',
          description:
            'Exploring the mysteries of the island and its inhabitants; Oceanic 6; Charles Widmore; questions that have been answered, and those that remain.',
          episodeNumber: 10,
          seasonNumber: 0,
          releaseDate: '2009-01-21',
          isSpecialEpisode: true,
          tmdbId: 334052,
        },
        {
          title: 'The Story of the Oceanic 6',
          description:
            'A retrospective exploring events in the lives of the Oceanic 6 and the other island survivors during the three years after Ben moved the island.',
          episodeNumber: 11,
          seasonNumber: 0,
          releaseDate: '2009-04-22',
          isSpecialEpisode: true,
          tmdbId: 334053,
        },
        {
          title: 'A Journey in Time',
          description:
            'Jack, Kate, Hurley, Sayid, Sun and Claire’s son, Aaron – otherwise known as the Oceanic 6 – were rescued and tried and pick up the pieces of the lives they knew before the crash and perpetuate the lie concocted to hide the truth of what really happened. But Jack and Ben had to convince them to return to the island in order to save those left behind. Upon returning, Jack, Kate, Hurley and Sayid were reunited with their fellow survivors – but found themselves in 1977 Dharma times. But Sun and Ben were not transported back to the ‘70s. They landed back on the island in present time and discovered the fate of the other members.',
          episodeNumber: 12,
          seasonNumber: 0,
          releaseDate: '2009-05-13',
          isSpecialEpisode: true,
          tmdbId: 334054,
        },
        {
          title: 'Final Chapter',
          description: 'Special recap for Season Six.',
          episodeNumber: 13,
          seasonNumber: 0,
          releaseDate: '2010-02-02',
          isSpecialEpisode: true,
          tmdbId: 334056,
        },
        {
          title: 'The Final Journey',
          description:
            'ABC invites new and avid "Lost" viewers to take a final glance at one of television\'s most talked about and critically acclaimed shows. The "Lost" Series Finale Event begins with this two-hour special, which takes a retrospective look back over the past six seasons of this groundbreaking series.',
          episodeNumber: 14,
          seasonNumber: 0,
          releaseDate: '2010-05-23',
          isSpecialEpisode: true,
          tmdbId: 334055,
        },
        {
          title: 'Aloha to Lost',
          description:
            "Jimmy Kimmel is a huge fan of Lost, therefore it was only appropriate that the opening scene of his show last night, titled ”Aloha to Lost”, showed him watching the show’s finale with his audience.\n\nAfter the conclusion of the episode, Kimmel invited several cast members from Lost onto his show, where they reminisced about their favorite moments and had a few laughs with Kimmel's presentation of alternate endings.",
          episodeNumber: 15,
          seasonNumber: 0,
          releaseDate: '2010-05-23',
          isSpecialEpisode: true,
          tmdbId: 334057,
        },
        {
          title: 'New Man In Charge',
          description:
            '"The New Man in Charge" is a mini-episode that follows the events of LOST\'s series finale which show what happened to Hurley and Ben.',
          episodeNumber: 16,
          seasonNumber: 0,
          releaseDate: '2010-08-24',
          isSpecialEpisode: true,
          tmdbId: 334058,
        },
        {
          title: 'Missing Pieces (1): The Watch',
          description:
            "Lost: Missing Pieces are 13 two- to three-minute stories of compelling, new, never-before-seen moments from the hit television show LOST. These newly-created scenes (not deleted scenes from previous episodes) reveal answers and new details about your favorite characters. For each story, we leave it up to the fans to figure out where these pieces fit into the overall mythology.\n\nChristian is talking with Jack about his wedding, which is later that day. Christian reveals that his father disapproved of him marrying Margo, and that was the reason he didn't wear the watch given to him by his father on his wedding day. However, he tells Jack that he is doing the right thing marrying Sarah and passes the watch to Jack, who immediately puts it on.",
          episodeNumber: 17,
          seasonNumber: 0,
          releaseDate: '2007-11-12',
          isSpecialEpisode: true,
          tmdbId: 334059,
        },
        {
          title: 'Missing Pieces (2): The Adventures of Hurley and Frogurt',
          description:
            "Hurley comes out of Rose's and Bernard's tent. Neil comes up, and ask what he is doing. He looks at the bottle of DHARMA Cabernet that Hurley has dropped, and then asks if Hurley is going to make a move on Libby. He asks because he has his eyes upon her himself. Hurley tells him that he just now has a date with Libby. Neil reluctantly relents and walks away.",
          episodeNumber: 18,
          seasonNumber: 0,
          releaseDate: '2007-11-19',
          isSpecialEpisode: true,
          tmdbId: 334060,
        },
        {
          title: 'Missing Pieces (3): King of the Castle',
          description:
            'Ben and Jack play chess. Ben asks Jack if he would consider staying on the Island. Jack asks Ben if he intends to keep his promise to let Jack leave. Ben says that its not all up to him in that the Island will not necessarily let Jack leave. He also tells Jack that if he does leave, there might be a time when he would want to come back.',
          episodeNumber: 19,
          seasonNumber: 0,
          releaseDate: '2007-11-27',
          isSpecialEpisode: true,
          tmdbId: 334061,
        },
        {
          title: 'Missing Pieces (4): The Deal',
          description:
            "Michael is tied up, when Juliet walks in. She tells him the boat is his, so that he can take Walt away after he will have saved Ben. She comments that Walt is special, that he's not an ordinary boy, and that's why she is worried about him. Juliet is glad that Michael is going to get Walt away from the Island and assures him that Ben will do what he wants. She then reveals the deal with Ben she has made herself, concerning her sister. Then she mentions Michael's list and wishes him good luck.",
          episodeNumber: 20,
          seasonNumber: 0,
          releaseDate: '2007-12-03',
          isSpecialEpisode: true,
          tmdbId: 334062,
        },
        {
          title: 'Missing Pieces (5): Operation: Sleeper',
          description:
            "Jack is asleep on the beach when Juliet wakes him up. She tells him that since Jack brought her to the camp Sayid and the others have not trusted her and think she is there to hurt them. Before Jack can say he will protect her, Juliet tells him that they are right and she is still working for Ben and she has been sent to the camp to do tests to find out which of the women are pregnant. Jack asks her why she is telling him this and she tells him how she saw Sun's baby the night before and that she is tired of living Ben's dream.",
          episodeNumber: 21,
          seasonNumber: 0,
          releaseDate: '2007-12-10',
          isSpecialEpisode: true,
          tmdbId: 334063,
        },
        {
          title: 'Missing Pieces (6): Room 23',
          description:
            'Juliet is outside Room 23 where there is some sort of commotion and an alarm sounding. Ben arrives and Juliet tells him that he (presumably Walt) has done something again and that everybody is too scared to go in there. Juliet suggests that they could bring him back to Michael, but Ben refuses. Ben tells her that Walt is special and that Jacob wanted him there, but Juliet says that he is dangerous. When Ben counters that he is only a child, Juliet brings him outside to show what he has done: a group of dead birds lay on the stairwell.',
          episodeNumber: 22,
          seasonNumber: 0,
          releaseDate: '2007-12-17',
          isSpecialEpisode: true,
          tmdbId: 334064,
        },
        {
          title: 'Missing Pieces (7): Arzt & Crafts',
          description:
            "Dr. Arzt tries to convince Jin and Sun not to move from the beach to the caves as Jack has proposed. When Hurley and Michael tell him they can't understand him, he also expresses his doubts in Jack's role as a leader to them. However he changes his mind and decides to move to the caves after all when the roaring of the monster interrupts their conversation.",
          episodeNumber: 23,
          seasonNumber: 0,
          releaseDate: '2007-12-24',
          isSpecialEpisode: true,
          tmdbId: 334065,
        },
        {
          title: 'Missing Pieces (8): Buried Secrets',
          description:
            'Sun is watching Jin fish and then walks into the jungle. There she buries a California drivers license when Michael runs by looking for Vincent. Seeing the license he picks it up and Sun tries to explain that she was going to leave Jin. Michael comforts her telling her it will be okay. The two almost share a kiss but Vincent appears barking before anything can happen, prompting Sun to leave.',
          episodeNumber: 24,
          seasonNumber: 0,
          releaseDate: '2007-12-30',
          isSpecialEpisode: true,
          tmdbId: 334066,
        },
        {
          title: 'Missing Pieces (9): Tropical Depression',
          description:
            'Dr. Arzt is catching a spider in the jungle when Michael comes up and asks about the weather conditions for launching the raft. Then Arzt admits he made up the story about the monsoon because he wanted them to get help with the raft as soon as possible. He then tells Michael he went to Sydney to meet a woman whom he had met on the internet, but that she disappeared during their first dinner in a restaurant.',
          episodeNumber: 25,
          seasonNumber: 0,
          releaseDate: '2008-01-07',
          isSpecialEpisode: true,
          tmdbId: 334067,
        },
        {
          title: 'Missing Pieces (10): Jack, Meet Ethan. Ethan? Jack',
          description:
            'Jack is searching for supplies when he meets Ethan Rom, who gives him a case full of medicine that he says he found in the jungle. Ethan mentions that Claire might have to deliver the baby on the island, and Jack thanks him for his assistance. Ethan tells Jack his own wife died in childbirth along with the baby, and they both hope that rescue is on the way.',
          episodeNumber: 26,
          seasonNumber: 0,
          releaseDate: '2008-01-14',
          isSpecialEpisode: true,
          tmdbId: 334068,
        },
        {
          title:
            'Missing Pieces (11): Jin Has a Temper-Tantrum On the Golf Course',
          description:
            'Hurley, Michael, and Jin are playing golf on the golf course. After Jin misses a putt to win the game, he goes on a temper-tantrum, shouting in Korean. As Hurley and Michael look on, Jin lets out all of his anger: he is unhappy, he doesn\'t want to be pitied, nobody understands him, and he is tired of the handcuffs. As Michael and Hurley eventually leave, Jin sits down, half crying, and repeating "I\'m so alone."',
          episodeNumber: 27,
          seasonNumber: 0,
          releaseDate: '2008-01-24',
          isSpecialEpisode: true,
          tmdbId: 334069,
        },
        {
          title: 'Missing Pieces (12): The Envelope',
          description:
            "Juliet is at her home at the Barracks when she notices that the muffins in the oven are burning. After scalding her hand while taking them out, the doorbell rings. It is Amelia. She helps Juliet, getting some ice for her hand, but realizes that something else is troubling Juliet. She asks if it is Ben, and Juliet says that things have gotten awkward between them. Amelia asks if he finally told her how he felt, but Juliet says he didn't; things are complicated. After Amelia further presses Juliet about what is going on, Juliet hints that they are somehow in trouble. Juliet then asks Amelia to keep quiet about something she is about to show her. As Juliet pulls an envelope out of the kitchen drawer, the doorbell rings...",
          episodeNumber: 28,
          seasonNumber: 0,
          releaseDate: '2008-01-28',
          isSpecialEpisode: true,
          tmdbId: 334070,
        },
        {
          title: 'Missing Pieces (13): So It Begins',
          description:
            'Vincent is running through the jungle on the island, when he encounters Christian Shephard. Christian tells Vincent to find Jack and wake him up because he "has work to do." The first scene of "Pilot, Part 1" then replays with Vincent encountering Jack as he is regaining consciousness.',
          episodeNumber: 29,
          seasonNumber: 0,
          releaseDate: '2008-02-04',
          isSpecialEpisode: true,
          tmdbId: 334071,
        },
        {
          title: 'Deleted Scenes from Lost - Comic Con 2011',
          description: null,
          episodeNumber: 30,
          seasonNumber: 0,
          releaseDate: null,
          isSpecialEpisode: true,
          tmdbId: 2721719,
        },
        {
          title: 'Lost 100',
          description:
            'Go in depth as the cast reflects on the first 100 episodes, and be a part of the cake-cutting ceremony with Duff Goldman of Ace of Cakes. (Disc 4)',
          episodeNumber: 31,
          seasonNumber: 0,
          releaseDate: null,
          isSpecialEpisode: true,
          tmdbId: 3184285,
        },
        {
          title: 'The Answers Are Here',
          description: null,
          episodeNumber: 32,
          seasonNumber: 0,
          releaseDate: null,
          isSpecialEpisode: true,
          tmdbId: 3460135,
        },
        {
          title: 'Bloopers',
          description: null,
          episodeNumber: 33,
          seasonNumber: 0,
          releaseDate: null,
          isSpecialEpisode: true,
          tmdbId: 3460137,
        },
      ],
    },
    {
      tmdbId: 14041,
      title: 'Season 1',
      description:
        'Mysteries abound on the first season of LOST as the survivors of Oceanic Air flight 815 find themselves stranded on an unidentified island with little hope of rescue.',
      poster:
        'https://image.tmdb.org/t/p/original/fc9f4ERC09U1GziCgDWilWWgjKx.jpg',
      seasonNumber: 1,
      numberOfEpisodes: 24,
      releaseDate: '2004-09-22',
      isSpecialSeason: false,
      episodes: [
        {
          title: 'Pilot (1)',
          description:
            "Stripped of everything, the 48 survivors scavenge what they can from the plane for their survival. Some panic. Some pin their hopes on rescue. A few find inner strength they never knew they had-like Kate who, with no medical training, suddenly finds herself suturing the doctor's wounds. The band of friends, family, enemies and strangers must work together against the cruel weather and harsh terrain. But the intense howls of  mysterious creatures stalking the jungle fill them all with fear. Fortunately, thanks to the calm leadership of quick-thinking Jack and level-headed Kate, they have hope. But even heroes have secrets, as the survivors will come to learn.",
          episodeNumber: 1,
          seasonNumber: 1,
          releaseDate: '2004-09-22',
          isSpecialEpisode: false,
          tmdbId: 333924,
        },
        {
          title: 'Pilot (2)',
          description:
            'Having escaped the "creature" and retrieved the plane transceiver, a group of the survivors travel to higher ground so they can transmit a signal. En route, they receive a mysterious transmission and encounter another of the island\'s inhabitants. Meanwhile, back at camp, Jack tends to a wounded man who reveals a secret about Kate.',
          episodeNumber: 2,
          seasonNumber: 1,
          releaseDate: '2004-09-29',
          isSpecialEpisode: false,
          tmdbId: 333946,
        },
        {
          title: 'Tabula Rasa',
          description:
            "Jack and Hurley discover an alarming secret about Kate, as the marshal's life hangs in the balance and he suffers a lot of pain. Meanwhile Kate, Charlie, Sawyer, Sayid, Boone and Shannon ponder the mysteries they have begun to uncover and worry that telling the other survivors will cause panic. They decide to lie for the time being. Also, Locke's befriending of Walt disturbs Michael, but Walt is more concerned in finding his dog. Lastly, Kate flashes back to when she was arrested by the marshal in Australia.",
          episodeNumber: 3,
          seasonNumber: 1,
          releaseDate: '2004-10-06',
          isSpecialEpisode: false,
          tmdbId: 333925,
        },
        {
          title: 'Walkabout',
          description:
            "The survivors are jolted awake in the middle of the night when wild island beasts (which are wild boars) invade the beach encampment. Kate and Michael join the mysterious Locke on a hunt for food -- and a shocking secret about Locke is revealed. On the hunt for food someone is injured. Meanwhile, some survivors are horrified by Jack's plan for the dead bodies still scattered among the wreckage -- he wants to burn them. Jack sees someone that's not there, and we find out that one of the survivors was not able to walk but now he can.",
          episodeNumber: 4,
          seasonNumber: 1,
          releaseDate: '2004-10-13',
          isSpecialEpisode: false,
          tmdbId: 333926,
        },
        {
          title: 'White Rabbit',
          description:
            "Jack is nearly delirious from lack of sleep and struggles to overcome the haunting events that brought him to Australia and, subsequently, to the island. Meanwhile, Boone gets caught in a treacherous riptide trying to save a woman who went out swimming. A pregnant Claire's health takes a bad turn from lack of fluids, and a thief may have stolen the last bottles of water. Veronica Hamel guest-stars as Jack's mother, Margo.\n\nAlso, Jack flashes back at 12 years old, to find himself on the playground in an altercation with a bully, who ultimately beats him up, and later learns a life lesson from his father.",
          episodeNumber: 5,
          seasonNumber: 1,
          releaseDate: '2004-10-20',
          isSpecialEpisode: false,
          tmdbId: 333927,
        },
        {
          title: 'House of the Rising Sun',
          description:
            "Walt and the others are shocked when Michael is brutally beaten, but only the non-English-speaking Jin and Sun know the truth behind the attack. Meanwhile Kate, Jack, Sawyer and Sayid argue about where the survivors should camp -- on the beach, where they're more likely to be seen, or in a remote inland valley where fresh water abounds; and Locke discovers Charlie's secret.",
          episodeNumber: 6,
          seasonNumber: 1,
          releaseDate: '2004-10-27',
          isSpecialEpisode: false,
          tmdbId: 333930,
        },
        {
          title: 'The Moth',
          description:
            "Charlie begins a painful journey of withdrawal from drugs, surprisingly aided by Locke, whose true motive for helping Charlie is a mystery. Meanwhile, survivors struggle to find and free Jack when he's buried alive in a cave collapse, and someone might be secretly thwarting Sayid, Kate, and Boone when they enact a plan to find the source of the French transmission.",
          episodeNumber: 7,
          seasonNumber: 1,
          releaseDate: '2004-11-03',
          isSpecialEpisode: false,
          tmdbId: 333929,
        },
        {
          title: 'Confidence Man',
          description:
            "Shannon's inhaler runs out and Boone believes Sawyer has the remaining three in his stash. When Sawyer refuses to give them up, Jack and Sayid resort to torturing Sawyer until he agrees to reveal the location of the inhalers. In flashback we hear Sawyer's story and find he is not who he says he is.",
          episodeNumber: 8,
          seasonNumber: 1,
          releaseDate: '2004-11-10',
          isSpecialEpisode: false,
          tmdbId: 333928,
        },
        {
          title: 'Solitary',
          description:
            "Sayid's life is placed in grave danger after he stumbles upon the source of the mysterious French transmission, the woman Danielle Rousseau (guest-star Mira Furlan). She was on the distress call and is found alive. Meanwhile, Hurley has a ridiculous plan to make life on the island a little more civilized.  The plan involves golf clubs he finds in the debris, and it looks like it just might work.  Lastly, we flash back to Sayid's childhood friend Nadia as well as his participation in hostage situations in Iraq.",
          episodeNumber: 9,
          seasonNumber: 1,
          releaseDate: '2004-11-17',
          isSpecialEpisode: false,
          tmdbId: 333945,
        },
        {
          title: 'Raised by Another',
          description:
            "Claire has a horribly realistic nightmare about her new baby being harmed or kidnapped. Flashbacks reveal Claire's backstory: the former boyfriend who got her pregnant, then abandoned her, and the psychic who convinced her to take the ill-fated flight that landed her on the island.  Hurley is shocked and confused when he discovers that Ethan Rom (guest-star William Mapother), another plane crash survivor, does not appear on the flight manifest.",
          episodeNumber: 10,
          seasonNumber: 1,
          releaseDate: '2004-12-01',
          isSpecialEpisode: false,
          tmdbId: 333931,
        },
        {
          title: 'All the Best Cowboys Have Daddy Issues',
          description:
            'Survivors wonder why Charlie and Claire have been abducted - and by whom - and a search party ventures into the treacherous jungle to look for the pair. Suspicions focus on Ethan Rom (guest-star William Mapother), who, it was recently discovered, was not a passenger on the doomed flight.  Jack battles inner demons relating to his father,  while Boone and Locke discover another island mystery.',
          episodeNumber: 11,
          seasonNumber: 1,
          releaseDate: '2004-12-08',
          isSpecialEpisode: false,
          tmdbId: 333932,
        },
        {
          title: 'Whatever the Case May Be',
          description:
            "Jack, Kate and Sawyer fight over possession of a newly discovered locked metal briefcase which might contain insights into Kate's mysterious past. Meanwhile, Sayid asks a reluctant Shannon to translate notes he took from the French woman. A rising tide threatens to engulf the fuselage and the entire beach encampment, and Rose and a grieving Charlie tentatively bond over Claire's baffling kidnapping.",
          episodeNumber: 12,
          seasonNumber: 1,
          releaseDate: '2005-01-05',
          isSpecialEpisode: false,
          tmdbId: 333933,
        },
        {
          title: 'Hearts and Minds',
          description:
            "When Locke learns that Boone wants to share their \"secret\" with Shannon, Locke decides to teach him a lesson.  This leads to Shannon's life being placed in what seems like peril.  Boone and Shannon's dark past is revealed in a shocking backstory that recalls their relationship right before the plane crash and presages the return of the beast. Kate, who has become a confidante to the soft-spoken Sun, is puzzled by Sun's mysterious behavior and the revelation that she can speak English.  A hungry Hurley must convince Jin to share his fish by making up for offending Jin by rejecting his offer of raw fish early on, or he'll continue to suffer digestive problems from the limited island diet.",
          episodeNumber: 13,
          seasonNumber: 1,
          releaseDate: '2005-01-12',
          isSpecialEpisode: false,
          tmdbId: 333934,
        },
        {
          title: 'Special',
          description:
            "Violence ensues and a mysterious island beast makes a re-appearance when Michael and Locke clash over Walt's upbringing. Meanwhile, Charlie is tempted to read the missing Claire's diary, and Sayid enlists Shannon to help decipher the French woman's map.",
          episodeNumber: 14,
          seasonNumber: 1,
          releaseDate: '2005-01-19',
          isSpecialEpisode: false,
          tmdbId: 333935,
        },
        {
          title: 'Homecoming',
          description:
            'After the missing Claire returns with no recollection of what has happened since before she boarded the doomed Oceanic flight 815, Jack and Locke formulate a plan of defense against her kidnapper, the mysterious Ethan (guest-star William Mapother), who threatens to kill off the other survivors one by one unless Claire is returned to him. Meanwhile, the disappointment Charlie feels when Claire does not remember him triggers recollections of a woman he had let down in the past.',
          episodeNumber: 15,
          seasonNumber: 1,
          releaseDate: '2005-02-09',
          isSpecialEpisode: false,
          tmdbId: 333936,
        },
        {
          title: 'Outlaws',
          description:
            'Kate and Sawyer divulge dark secrets to each other while tracking a renegade boar that Sawyer swears is purposely harassing him.  Hurley and Sayid worry that Charlie is losing it after facing a brush with death and killing Ethan with 6 bullets to the chest.  A shocking prior connection between Sawyer and Jack is revealed in a flashback which shows Sawyer meeting Jack\'s father in a bar. Robert Patrick ("Terminator 2: Judgment Day," "The X-File") guest stars.',
          episodeNumber: 16,
          seasonNumber: 1,
          releaseDate: '2005-02-16',
          isSpecialEpisode: false,
          tmdbId: 333937,
        },
        {
          title: '...In Translation',
          description:
            "When the raft the survivors have been building mysteriously burns down, Michael is convinced that Jin is responsible for the sabotage, which only serves to escalate their rivalry. Meanwhile, Sun stuns her fellow survivors with a surprising revelation, and Boone gives Sayid a warning about his step-sister Shannon. Lastly, more details of Jin and Sun's troubled marriage are revealed through flashbacks.",
          episodeNumber: 17,
          seasonNumber: 1,
          releaseDate: '2005-02-23',
          isSpecialEpisode: false,
          tmdbId: 333938,
        },
        {
          title: 'Numbers',
          description:
            'When Hurley becomes obsessed with the French woman and heads into the jungle to find her, Jack, Sayid and Charlie have no choice but to follow. Hurley flashes back to the hugely life-altering experience he had before boarding the plane.',
          episodeNumber: 18,
          seasonNumber: 1,
          releaseDate: '2005-03-02',
          isSpecialEpisode: false,
          tmdbId: 333939,
        },
        {
          title: 'Deus Ex Machina',
          description:
            "Locke thinks he's being sent a sign on how to get the hatch open, and he and Boone venture inland. Jack is reluctant to offer assistance when Sawyer begins to experience excruciating headaches and needs glasses.",
          episodeNumber: 19,
          seasonNumber: 1,
          releaseDate: '2005-03-30',
          isSpecialEpisode: false,
          tmdbId: 333940,
        },
        {
          title: 'Do No Harm',
          description:
            'Jack tends to a severely wounded Boone after Locke returns him to the caves.  In the confusion, Locke slips away to deal with his guilt over the crisis. Meanwhile, Claire unexpectedly goes into labor while deep in the forest.',
          episodeNumber: 20,
          seasonNumber: 1,
          releaseDate: '2005-04-06',
          isSpecialEpisode: false,
          tmdbId: 333941,
        },
        {
          title: 'The Greater Good',
          description:
            "After another funeral, tempers rise as the survivors' suspicions of each other grow, and an unlikely survivor vows revenge. The events that landed Sayid on Flight 815 play out as he engages Locke in a psychological game of cat and mouse to uncover the truth about the mishap that claimed Boone's life.",
          episodeNumber: 21,
          seasonNumber: 1,
          releaseDate: '2005-05-04',
          isSpecialEpisode: false,
          tmdbId: 333942,
        },
        {
          title: 'Born to Run',
          description:
            "Jack suspects foul play when Michael becomes violently ill while building the raft. The suspects include Sawyer and Kate, who compete for the last seat on the raft and do anything possible to prevent each other from getting it.  Meanwhile, a secret from Kate's past is revealed to the other survivors on the island.",
          episodeNumber: 22,
          seasonNumber: 1,
          releaseDate: '2005-05-11',
          isSpecialEpisode: false,
          tmdbId: 333943,
        },
        {
          title: 'Exodus (1)',
          description:
            'The French woman-Danielle Rousseau-shocks the survivors by showing up to the camp with a dire warning about "the Others" who are on the island, and the black smoke that precedes them. Meanwhile, Michael and Jin ready the raft for sailing.  In flashbacks, we see the survivors final moments before they boarded their fateful flight.',
          episodeNumber: 23,
          seasonNumber: 1,
          releaseDate: '2005-05-18',
          isSpecialEpisode: false,
          tmdbId: 333944,
        },
        {
          title: 'Exodus (2)',
          description:
            "The castaways on the raft are surprised at sea by something unexpected. Meanwhile, remaining islanders attempt to blow open the hatch, and a visitor to the encampment might be a threat to Claire's infant son.",
          episodeNumber: 24,
          seasonNumber: 1,
          releaseDate: '2005-05-25',
          isSpecialEpisode: false,
          tmdbId: 333947,
        },
      ],
    },
    {
      tmdbId: 14042,
      title: 'Season 2',
      description:
        'The second season of the American serial drama television series Lost commenced airing in the United States and Canada on September 21, 2005 and concluded on May 24, 2006. The second season continues the stories of a group of over forty people who have been stranded on a remote island in the south Pacific, after their airplane crashed forty-four days prior to the beginning of the season. The producers have stated that as the first season is about introducing the survivors, the second season is about a 1970s scientific Dharma Initiative research station which the survivors discovered on the island and refer to as "the hatch". The second season aired Wednesdays at 9:00 pm in the United States. In addition to the regular twenty-four episodes, three clip-shows recapped previous events on the show. "Destination Lost" aired before the premiere, "Lost: Revelation" aired before the tenth episode and "Lost: Reckoning" aired before the twentieth episode. The season was released on DVD as a seven disc boxed set under the title of Lost: The Complete Second Season – The Extended Experience on September 5, 2006 by Buena Vista Home Entertainment.',
      poster:
        'https://image.tmdb.org/t/p/original/vGLddXoXJhKPsAWeDYbAsE4wW1z.jpg',
      seasonNumber: 2,
      numberOfEpisodes: 24,
      releaseDate: '2005-09-21',
      isSpecialSeason: false,
      episodes: [
        {
          title: 'Man of Science, Man of Faith',
          description:
            "Jack, Locke and Kate explore the mysterious hatch but Jack decides to wait before going down into the hatch. Kate and Locke aren't so patient. When Shannon chases after Vincent the dog, she encounters a familiar face in the jungle.",
          episodeNumber: 1,
          seasonNumber: 2,
          releaseDate: '2005-09-21',
          isSpecialEpisode: false,
          tmdbId: 333948,
        },
        {
          title: 'Adrift',
          description:
            "With the abduction of Walt fresh on their minds, their raft destroyed, and Jin missing, Michael and Sawyer fight for their lives in the middle of nowhere in the ocean and discover a new predator in the roiling sea. Meanwhile on land, Locke must descend into the hatch when Kate goes missing inside.  Also, Jack isn't too far behind Locke as he decides to go into the hatch as well later on. Lastly, flashbacks reveal more of Michael's troubled relationship with ex-lover Susan and their baby son Walt as they fight over custody for Walt and Michael must let go.",
          episodeNumber: 2,
          seasonNumber: 2,
          releaseDate: '2005-09-28',
          isSpecialEpisode: false,
          tmdbId: 333949,
        },
        {
          title: 'Orientation',
          description:
            'Jack, Locke and Kate learn more secrets about the hatch. Meanwhile, after being beaten and taken captive, Sawyer, Michael and Jin wonder if their captors are fellow survivors or the dreaded "Others." Flashbacks reveals more of Locke\'s past in this episode as well as the introduction of  Helen (guest star Katey Segal) who shakes things up even more with her revealing personality and past.',
          episodeNumber: 3,
          seasonNumber: 2,
          releaseDate: '2005-10-05',
          isSpecialEpisode: false,
          tmdbId: 333950,
        },
        {
          title: 'Everybody Hates Hugo',
          description:
            'Hurley struggles with an assigned task inside the hatch as he flashbacks to disturbing memories in his life before the crash. Meanwhile, Sawyer, Michael and Jin learn the identities of their captors on the island. Claire uncovers a startling piece of information about the fate of the raft.',
          episodeNumber: 4,
          seasonNumber: 2,
          releaseDate: '2005-10-12',
          isSpecialEpisode: false,
          tmdbId: 333951,
        },
        {
          title: '...And Found',
          description:
            "Michael sets off into the jungle by himself determined to find Walt, but discovers that he is not alone. Meanwhile, Sawyer and Jin are ordered by their captors to take them to their camp, and Sun frantically searches for her missing wedding ring. In flashbacks this episode reveals more of Jin's life before ending up on the island.",
          episodeNumber: 5,
          seasonNumber: 2,
          releaseDate: '2005-10-19',
          isSpecialEpisode: false,
          tmdbId: 333952,
        },
        {
          title: 'Abandoned',
          description:
            "Sawyer's wound becomes life-threatening as he, Michael and Jin make their way through the interior of the island with the tail section survivors. Meanwhile, Shannon is once again haunted by visions of Walt.",
          episodeNumber: 6,
          seasonNumber: 2,
          releaseDate: '2005-11-09',
          isSpecialEpisode: false,
          tmdbId: 333953,
        },
        {
          title: 'The Other 48 Days',
          description:
            'The harrowing first 48 days in the lives of the tail section survivors are revealed. Flashbacks reveal the point of view of Ana-Lucia, Mr. Eko, Bernard and Libby and other survivors as they landed on the other side of the island on the beach. As the days progress danger hits their camp as well when "The Others" start taking people against their will.  As the survivors race inland, trying to stay a step ahead of The Others, they realize that someone among them wasn\'t on Flight 815.',
          episodeNumber: 7,
          seasonNumber: 2,
          releaseDate: '2005-11-16',
          isSpecialEpisode: false,
          tmdbId: 333954,
        },
        {
          title: 'Collision',
          description:
            "Violence erupts when Ana Lucia and her group stumble upon Sayid and the other castaways on the island. Ana Lucia holds Sayid captive. Kate and Jack care for Sawyer when Mr. Eko brings him back to the camp himself. Flashbacks reveal Ana Lucia's troubled life as a cop.",
          episodeNumber: 8,
          seasonNumber: 2,
          releaseDate: '2005-11-23',
          isSpecialEpisode: false,
          tmdbId: 333955,
        },
        {
          title: 'What Kate Did',
          description:
            'As Kate’s backstory continues, her original crime is revealed. She thinks something is haunting her through Sawyer.  Locke and Eko make an interesting discovery about the film, and Michael has a mysterious encounter with the computer.',
          episodeNumber: 9,
          seasonNumber: 2,
          releaseDate: '2005-11-30',
          isSpecialEpisode: false,
          tmdbId: 333970,
        },
        {
          title: 'The 23rd Psalm',
          description:
            'This episode will shed more light on why Eko took a mysterious 40-day vow of silence, and possibly information on his stick. Also, Claire begins to lose faith in Charlie after Eko begins to question him about the Virgin Mary statue, and Kate gives the recovering Sawyer a much-needed haircut.',
          episodeNumber: 10,
          seasonNumber: 2,
          releaseDate: '2006-01-11',
          isSpecialEpisode: false,
          tmdbId: 333956,
        },
        {
          title: 'The Hunting Party',
          description:
            'Jack, Locke and Sawyer follow after a determined Michael after he heads into the jungle toward the dreaded "Others" in search of Walt. Meanwhile, Sun has a surprising reaction to Jin\'s desire to join the search party, and Hurley and Charlie commiserate over the age-old conundrum of "what women want."',
          episodeNumber: 11,
          seasonNumber: 2,
          releaseDate: '2006-01-18',
          isSpecialEpisode: false,
          tmdbId: 333957,
        },
        {
          title: 'Fire + Water',
          description:
            "When Charlie's vividly surreal dreams lead him to believe Claire's baby, Aaron, is in danger, Locke suspects Charlie may be using again. Meanwhile, Sawyer encourages Hurley to act on his attraction to Libby.",
          episodeNumber: 12,
          seasonNumber: 2,
          releaseDate: '2006-01-25',
          isSpecialEpisode: false,
          tmdbId: 333958,
        },
        {
          title: 'The Long Con',
          description:
            'Some of the island survivors fear that "The Others" may have returned when Sun is greatly injured during a failed kidnapping attempt at her plant garden. Also, the trust barrier becomes very thin between Locke and Jack in terms of locking up the guns and being kept safe. Meanwhile, Sawyer is an amused but highly interested bystander when tension escalates between Jack, Locke, Kate and Ana Lucia. When Jack purposely takes Sawyer\'s medication from him he pushes more in favor of helping Locke. Lastly, flashbacks reveal more of Sawyer\'s con artist past.',
          episodeNumber: 13,
          seasonNumber: 2,
          releaseDate: '2006-02-08',
          isSpecialEpisode: false,
          tmdbId: 333959,
        },
        {
          title: 'One of Them',
          description:
            'After Sun is attacked, some of the survivors begin to think that one of the "other survivors" might be one of "The Others." When French woman Danielle Rousseau leads Sayid to a mysterious captive in the jungle, he becomes determined to find out if he is one of "The Others". Meanwhile, Sawyer discovers Hurley’s potentially devastating breach of the survivors’ trust and blackmails him into helping track an elusive island creature that won’t leave Sawyer alone.',
          episodeNumber: 14,
          seasonNumber: 2,
          releaseDate: '2006-02-15',
          isSpecialEpisode: false,
          tmdbId: 333960,
        },
        {
          title: 'Maternity Leave',
          description:
            "A mysterious illness that baby Aaron suddenly contracts sends a desperate Claire, Kate and French woman Danielle to return to the same area where Claire was initially kidnapped. It is there where she believes she can find a cure for Aaron's illness. In the meantime, Jack and Locke are doing their best to keep their prisoner a secret from the rest of the survivors on the island.",
          episodeNumber: 15,
          seasonNumber: 2,
          releaseDate: '2006-03-01',
          isSpecialEpisode: false,
          tmdbId: 333961,
        },
        {
          title: 'The Whole Truth',
          description:
            'Sun comes to the realization that she might be pregnant. She struggles on whether to tell Jin about the situation. Meanwhile, with no success from Jack or Sayid, Ana-Lucia is called in by Locke to interrogate the new prisoner Henry Gale to get more information out of him about the balloon that he and his wife supposedly landed on the island with.',
          episodeNumber: 16,
          seasonNumber: 2,
          releaseDate: '2006-03-22',
          isSpecialEpisode: false,
          tmdbId: 333962,
        },
        {
          title: 'Lockdown',
          description:
            'When the hatch suddenly takes on a life of its own, Locke is forced to enlist the help of an unlikely ally to control the matter. Meanwhile, Ana Lucia, Sayid and Charlie go off into the jungle to find out the truth about Henry Gale and see if there really is balloon craft out there in the jungle that carried him and his wife to the island.',
          episodeNumber: 17,
          seasonNumber: 2,
          releaseDate: '2006-03-29',
          isSpecialEpisode: false,
          tmdbId: 333963,
        },
        {
          title: 'Dave',
          description:
            "Libby lends a helping hand to Hurley to support him when he begins to think the island is having a strange effect on him. Hurley begins to see Dave (guest-star Evan Handler, Sex and the City) on the island, who was his friend in the mental institution Hurley was in. Also, Locke's sense of purpose is shaken when the prisoner gives him new information about the hatch.",
          episodeNumber: 18,
          seasonNumber: 2,
          releaseDate: '2006-04-05',
          isSpecialEpisode: false,
          tmdbId: 333964,
        },
        {
          title: 'S.O.S.',
          description:
            'Rose is surprisingly and vehemently opposed to Bernard\'s plan to create an S.O.S. signal; romantic sparks are rekindled between Jack and Kate when they trek into the jungle to propose a "trade" with "The Others"; and Locke begins to question his faith in the island.',
          episodeNumber: 19,
          seasonNumber: 2,
          releaseDate: '2006-04-12',
          isSpecialEpisode: false,
          tmdbId: 333965,
        },
        {
          title: 'Two for the Road',
          description:
            'After finding an exhausted Michael in the forest, Jack and Kate bring him back to the main camp. When he finally wakes up, Michael has some new details about "The Others." Also, a lovestruck Hurley plans a date for Libby.',
          episodeNumber: 20,
          seasonNumber: 2,
          releaseDate: '2006-05-03',
          isSpecialEpisode: false,
          tmdbId: 333966,
        },
        {
          title: '?',
          description:
            'Mr. Eko has dreams about his brother leading him somewhere. He seeks Locke\'s help in finding a secret location, the "question mark." Meanwhile, Jack and the other survivors grapple with the horrific situation in the hatch with the death of Ana-Lucia and Libby clinging to life.',
          episodeNumber: 21,
          seasonNumber: 2,
          releaseDate: '2006-05-10',
          isSpecialEpisode: false,
          tmdbId: 333967,
        },
        {
          title: 'Three Minutes',
          description:
            'A determined Michael convinces Jack and several castaways to help him rescue Walt from "The Others." With Jack away, Locke is left in charge of the hatch and must decide if he should believe Henry and not push the button, risking everyone\'s safety.  Meanwhile, the events that happened to Michael after he left are finally revealed. Meanwhile, Charlie struggles with Eko\'s decision to discontinue building the church.',
          episodeNumber: 22,
          seasonNumber: 2,
          releaseDate: '2006-05-17',
          isSpecialEpisode: false,
          tmdbId: 333968,
        },
        {
          title: 'Live Together, Die Alone (1)',
          description:
            'After discovering something odd just offshore, Jack and Sayid come up with a plan to confront "The Others" and hopefully get Walt back. At the same time there will be an answer to the question of where Michael has been and resolution of him and Walt. Meanwhile, Eko and Locke come to blows as Locke makes a potentially cataclysmic decision regarding the "button" and the hatch. Lastly, Desmond returns and he sheds some more light on his experience on the island in the three years prior to when Locke came down into that hatch.',
          episodeNumber: 23,
          seasonNumber: 2,
          releaseDate: '2006-05-24',
          isSpecialEpisode: false,
          tmdbId: 333969,
        },
        {
          title: 'Live Together, Die Alone (2)',
          description:
            'After discovering something odd just offshore, Jack and Sayid come up with a plan to confront "The Others" and hopefully get Walt back. Meanwhile, Eko and Locke come to blows as Locke makes a potentially cataclysmic decision regarding the "button" and the hatch.',
          episodeNumber: 24,
          seasonNumber: 2,
          releaseDate: '2006-05-24',
          isSpecialEpisode: false,
          tmdbId: 333971,
        },
      ],
    },
    {
      tmdbId: 14043,
      title: 'Season 3',
      description:
        'The third season of the American serial drama television series Lost commenced airing in the United States and Canada on October 4, 2006 and concluded on May 23, 2007. The third season continues the stories of a group of over 40 people who have been stranded on a remote island in the South Pacific, after their airplane crashed 68 days prior to the beginning of the season. In the Lost universe, the season takes place from November 28 to December 21, 2004. The producers have stated that as the first season is about introducing the survivors and the second season is about the hatch, the third season is about the Others, a group of mysterious island inhabitants.\n\nIn response to fan complaints about scheduling in the previous seasons, ABC decided to air the episodes without reruns, albeit in two separate blocks. In the United States, the first block consisted of six episodes aired on Wednesdays at 9:00 pm and after a twelve week break, the season continued with the remaining 16 episodes at 10:00 pm. In addition, three clip-shows recapped previous events on the show. "Lost: A Tale of Survival" aired a week before the season premiere, "Lost Survivor Guide" aired before the seventh episode and "Lost: The Answers" aired before the season finale Buena Vista Home Entertainment released the season under the title Lost: The Complete Third Season – The Unexplored Experience on December 11, 2007 in Region 1 on DVD and Blu-ray Disc.',
      poster:
        'https://image.tmdb.org/t/p/original/zLnuh6DVyrz5iaNVO6KNKubtffo.jpg',
      seasonNumber: 3,
      numberOfEpisodes: 23,
      releaseDate: '2006-10-04',
      isSpecialSeason: false,
      episodes: [
        {
          title: 'A Tale of Two Cities',
          description:
            'Jack, Kate, and Sawyer are prisoners of the mysterious "Others." After their captors drug them and take blood samples, they are held in separate areas. The camp leaders--Ben (Henry Gale), Mr. Friendly and a new woman, Juliet--try to make the castaways adjust to their new circumstances.\n\nFlashbacks reveal more about Jack\'s past with his father and his wife Sarah.',
          episodeNumber: 1,
          seasonNumber: 3,
          releaseDate: '2006-10-04',
          isSpecialEpisode: false,
          tmdbId: 333974,
        },
        {
          title: 'The Glass Ballerina',
          description:
            'Sun and Jin\'s lives are put in danger when Sayid tries to locate Jack and the other missing castaways. Sayid also creates a plan in order to get the attention of the "Others" on the beach. Meanwhile, Henry (i.e. Ben) gives Jack an offer that is very tempting in exchange for his cooperation. Lastly, Kate and Sawyer must adjust to harsh conditions that are being forced upon them by "The Others."',
          episodeNumber: 2,
          seasonNumber: 3,
          releaseDate: '2006-10-11',
          isSpecialEpisode: false,
          tmdbId: 333972,
        },
        {
          title: 'Further Instructions',
          description:
            'Locke, Eko and Desmond are found scattered about the island after the implosion of the hatch. Locke receives a message from the Island asking him to fix the situation he caused.\n\nHurley returns to the beach camp to report the imprisonment of Kate, Jack and Sawyer by the Others.\n\nDesmond has been fundamentally altered by the implosion, giving him a mysterious new power.',
          episodeNumber: 3,
          seasonNumber: 3,
          releaseDate: '2006-10-18',
          isSpecialEpisode: false,
          tmdbId: 333973,
        },
        {
          title: 'Every Man for Himself',
          description:
            "The Others prevent Sawyer and Kate from escaping, leaving Sawyer perplexed by the extent of the measures taken to keep them imprisoned. Jack is asked to use his medical training to save the life of one of the Others. At the beach, Desmond's strange behavior attracts attention. He begins to construct a mysterious device.",
          episodeNumber: 4,
          seasonNumber: 3,
          releaseDate: '2006-10-25',
          isSpecialEpisode: false,
          tmdbId: 333975,
        },
        {
          title: 'The Cost of Living',
          description:
            'A delirious Eko wrestles with past demons; some of the castaways go to the Pearl station to find a computer they can use to locate Jack, Kate and Sawyer; Jack does not know who to trust when two of the Others are at odds with each other.',
          episodeNumber: 5,
          seasonNumber: 3,
          releaseDate: '2006-11-01',
          isSpecialEpisode: false,
          tmdbId: 333976,
        },
        {
          title: 'I Do',
          description:
            "Jack makes a decision regarding Ben's offer. Sawyer's life is placed in danger when Pickett decides to make good on his threat. Locke discovers a hidden message that may help unlock the island's secrets. Kate recalls memories from the past, which caused her to make an important choice.",
          episodeNumber: 6,
          seasonNumber: 3,
          releaseDate: '2006-11-08',
          isSpecialEpisode: false,
          tmdbId: 333977,
        },
        {
          title: 'Not in Portland',
          description:
            "Jack has the Others in a desperate situation as he holds Ben's life in his hands.  Meanwhile, Kate and Sawyer try to escape from their captors. Flashbacks reveal Juliet's past as a medical researcher in Miami.",
          episodeNumber: 7,
          seasonNumber: 3,
          releaseDate: '2007-02-07',
          isSpecialEpisode: false,
          tmdbId: 333978,
        },
        {
          title: 'Flashes Before Your Eyes',
          description:
            'After Desmond rescues Claire from drowning, Charlie gets Hurley to help him find out why Desmond has seemed able to predict the future. Desmond recalls exactly what took place in the moments after he turns the key, where he experienced a strange vision of his life prior to his Army days.',
          episodeNumber: 8,
          seasonNumber: 3,
          releaseDate: '2007-02-14',
          isSpecialEpisode: false,
          tmdbId: 333979,
        },
        {
          title: 'Stranger in a Strange Land',
          description:
            "As Kate and Sawyer journey back to the main island with Karl, who is exhibiting effects of the brainwashing video, they argue over whether to go back and save Jack. On Hydra island, as Juliet's fate rests in his hands and a power struggle within the Others ensues, Jack recollects the time he spent in Phuket, Thailand and his relationship with Achara, a mysterious tattoo artist.",
          episodeNumber: 9,
          seasonNumber: 3,
          releaseDate: '2007-02-21',
          isSpecialEpisode: false,
          tmdbId: 333980,
        },
        {
          title: 'Tricia Tanaka Is Dead',
          description:
            "Kate is still struggling over their decision to leave Jack in the hands of the Others as she and Sawyer return to their camp.  Meanwhile, Hurley finds an old van in the jungle and attempts to use it to help a fellow survivor in need of faith and hope.  Flashbacks reveal more of Hurley's tumultuous past with the numbers curse.",
          episodeNumber: 10,
          seasonNumber: 3,
          releaseDate: '2007-02-28',
          isSpecialEpisode: false,
          tmdbId: 333981,
        },
        {
          title: 'Enter 77',
          description:
            'On their mission to rescue Jack, Kate, Sayid, and Locke stumble upon a mysterious structure surrounded by farm animals and meet its strange inhabitant. Back at the camp, in order to reclaim his belongings, Sawyer plays in a ping-pong competition.',
          episodeNumber: 11,
          seasonNumber: 3,
          releaseDate: '2007-03-07',
          isSpecialEpisode: false,
          tmdbId: 333982,
        },
        {
          title: 'Par Avion',
          description:
            'Claire has an idea to send a message to the outside world. Charlie, however, is resistant to the idea, and Desmond tries to sabotage the plan. As Claire tries to get the truth behind their actions out of the pair, she remembers traumatic events from her past. Meanwhile, the rescue party encounters a dangerous obstacle.',
          episodeNumber: 12,
          seasonNumber: 3,
          releaseDate: '2007-03-14',
          isSpecialEpisode: false,
          tmdbId: 333983,
        },
        {
          title: 'The Man from Tallahassee',
          description:
            "When Kate and Locke arrive at the Others' camp, Ben promises to tell Locke the island's secrets as long as he stops his destructive plan, and Kate's reunion with Jack doesn't go very well when she learns that the Others have offered him a deal. More of Locke's troubled past is revealed.",
          episodeNumber: 13,
          seasonNumber: 3,
          releaseDate: '2007-03-21',
          isSpecialEpisode: false,
          tmdbId: 333984,
        },
        {
          title: 'Exposé',
          description:
            'As the truth about Sun\'s kidnapping by "the Others" comes to her attention, Hurley becomes suspicious of Sawyer\'s attempt to reveal the mystery behind two fellow survivors, Nikki and Paulo. Through series of flashbacks we will discover what Nikki and Paulo were doing before the crash and how they survived 65 days on the island.',
          episodeNumber: 14,
          seasonNumber: 3,
          releaseDate: '2007-03-28',
          isSpecialEpisode: false,
          tmdbId: 333985,
        },
        {
          title: 'Left Behind',
          description:
            "Kate and Juliet are stranded in the jungle after Kate learns that there is a traitor in the survivor's midst. Meanwhile, Sawyer's poor attitude and selfish ways towards the beach community may earn him a vote of banishment if he doesn't have a change of heart.",
          episodeNumber: 15,
          seasonNumber: 3,
          releaseDate: '2007-04-04',
          isSpecialEpisode: false,
          tmdbId: 333986,
        },
        {
          title: 'One of Us',
          description:
            "The celebration of Jack's return is cut short when he arrives at the beach with an Other, Juliet, whose flashbacks pick up from where they left off, showing us how she got onto the island and became an other. Meanwhile, Claire is threatened by a strange illness.",
          episodeNumber: 16,
          seasonNumber: 3,
          releaseDate: '2007-04-11',
          isSpecialEpisode: false,
          tmdbId: 333987,
        },
        {
          title: 'Catch-22',
          description:
            'Desmond convinces Hurley, Jin, and Charlie to follow him on a trek through the jungle after he receives a series of visions. Flashbacks reveal the time that Desmond spent with a cloister of monks. Meanwhile, a despondent Kate turns to Sawyer for companionship after seeing Jack and Juliet together.',
          episodeNumber: 17,
          seasonNumber: 3,
          releaseDate: '2007-04-18',
          isSpecialEpisode: false,
          tmdbId: 333988,
        },
        {
          title: 'D.O.C.',
          description:
            'Sun allows Juliet to examine her when she learns that all of "The Others" pregnant woman died before they gave birth on the island. Meanwhile, Desmond and an unlikely nemesis collaborate to save a new island inhabitant\'s life.',
          episodeNumber: 18,
          seasonNumber: 3,
          releaseDate: '2007-04-25',
          isSpecialEpisode: false,
          tmdbId: 333989,
        },
        {
          title: 'The Brig',
          description:
            'After abandoning the Others, Locke takes Sawyer on a trek through the jungle to help him eliminate a common enemy. Meanwhile, back at the beach, the parachutist Naomi has crucial information about flight 815.',
          episodeNumber: 19,
          seasonNumber: 3,
          releaseDate: '2007-05-02',
          isSpecialEpisode: false,
          tmdbId: 333990,
        },
        {
          title: 'The Man Behind the Curtain',
          description:
            "Ben unwillingly divulges information to Locke about the island, taking him on a journey to various locations including strange monuments and the mysterious Jacob. Back at the beach, Juliet's secret is revealed. Flashbacks will show us the origins of DHARMA and the history of the island, including 'the purge.'",
          episodeNumber: 20,
          seasonNumber: 3,
          releaseDate: '2007-05-09',
          isSpecialEpisode: false,
          tmdbId: 333991,
        },
        {
          title: 'Greatest Hits',
          description:
            'While Jack devises a plan to do away with "The Others" once and for all, Sayid uncovers a flaw in "The Others\'" system that could lead to everyone\'s rescue. But it requires Charlie to take on a dangerous task that may make Desmond\'s premonition come true.\n\nA Charlie-centric episode.',
          episodeNumber: 21,
          seasonNumber: 3,
          releaseDate: '2007-05-16',
          isSpecialEpisode: false,
          tmdbId: 333992,
        },
        {
          title: 'Through the Looking Glass (1)',
          description:
            'The season 3 finale finds the castaways preparing for an invasion by the slightly less mysterious Others, while Charlie and Desmond find more than they were looking for in the underwater "Looking Glass Hatch".',
          episodeNumber: 22,
          seasonNumber: 3,
          releaseDate: '2007-05-23',
          isSpecialEpisode: false,
          tmdbId: 333993,
        },
        {
          title: 'Through The Looking Glass (2)',
          description:
            'The season 3 finale finds the castaways preparing for an invasion by the slightly less mysterious Others, while Charlie and Desmond find more than they were looking for in the underwater "Looking Glass Hatch".',
          episodeNumber: 23,
          seasonNumber: 3,
          releaseDate: '2007-05-23',
          isSpecialEpisode: false,
          tmdbId: 333994,
        },
      ],
    },
    {
      tmdbId: 14044,
      title: 'Season 4',
      description:
        'The fourth season of the American serial drama television series Lost commenced airing on the American Broadcasting Company Network in the United States, and on CTV in Canada on January 31, 2008 and concluded on May 29, 2008. The season continues the stories of a group of over 40 people who have been stranded on a remote island in the South Pacific, after their airplane crashed there more than 90 days prior to the beginning of the season. According to Lost\'s executive producers/writers/showrunners Damon Lindelof and Carlton Cuse, there are two main themes in fourth season: "the castaways\' relationship to the freighter folk" and "who gets off the island and the fact that they need to get back". Lost came under scrutiny from critics in its third season, but the fourth season was acclaimed for its flash-forwards, pace and new characters.\n\nThe season was originally planned to contain 16 episodes; eight were filmed before the start of the 2007–2008 Writers Guild of America strike. Following the strike\'s resolution, it was announced that only five more episodes would be produced to complete the season; however, the season finale\'s script was so long that network executives approved the production of a 14th episode as part of a three-hour season finale split over two nights. The fourth season aired Tuesdays at 9:00 pm from January 31 to March 20, 2008 and at 10:00 pm from April 24 to May 15, 2008. The two-hour finale aired at 9:00 pm on May 29, 2008. Buena Vista Home Entertainment released the season on DVD and Blu-ray Disc under the title Lost: The Complete Fourth Season – The Expanded Experience on December 9, 2008 in Region 1; however, it was released earlier—on October 20, 2008—in Region 2.',
      poster:
        'https://image.tmdb.org/t/p/original/TOfSxtW76sWrPn3YSm5GooaR3Y.jpg',
      seasonNumber: 4,
      numberOfEpisodes: 14,
      releaseDate: '2008-01-31',
      isSpecialSeason: false,
      episodes: [
        {
          title: 'The Beginning of the End',
          description:
            "They thought they had met the enemy. They thought they had seen evil. They thought wrong. As the new season begins, the survivors feel that rescue is close at hand, but they don't know whether or not to believe Charlie's final message that the people claiming to liberate them are not who they seem to be. As unlikely alliances are formed, those they thought could be trusted may turn against them, as the enemy of their enemy becomes their friend. But who can be trusted? Is rescue really as close as it seems?",
          episodeNumber: 1,
          seasonNumber: 4,
          releaseDate: '2008-01-31',
          isSpecialEpisode: false,
          tmdbId: 333996,
        },
        {
          title: 'Confirmed Dead',
          description:
            'The survivors begin to question the intentions of their supposed rescuers when four strangers arrive on the island.',
          episodeNumber: 2,
          seasonNumber: 4,
          releaseDate: '2008-02-07',
          isSpecialEpisode: false,
          tmdbId: 333995,
        },
        {
          title: 'The Economist',
          description:
            "Locke's hostage may be the key to getting off the island, so Sayid and Kate go in search of their fellow castaway in an attempt to negotiate a peaceful deal.",
          episodeNumber: 3,
          seasonNumber: 4,
          releaseDate: '2008-02-14',
          isSpecialEpisode: false,
          tmdbId: 333997,
        },
        {
          title: 'Eggtown',
          description:
            "Kate needs to get information out of the hostages, but it may jeopardize her standing with Locke -- as well as with Sawyer. Meanwhile in the future Kate's Court hearings take place.",
          episodeNumber: 4,
          seasonNumber: 4,
          releaseDate: '2008-02-21',
          isSpecialEpisode: false,
          tmdbId: 333998,
        },
        {
          title: 'The Constant',
          description:
            'Sayid and Desmond hit a bit of turbulence on the way to the freighter, which causes Desmond to experience some unexpected side effects.',
          episodeNumber: 5,
          seasonNumber: 4,
          releaseDate: '2008-02-28',
          isSpecialEpisode: false,
          tmdbId: 334000,
        },
        {
          title: 'The Other Woman',
          description:
            'Juliet receives an unwelcome visit from someone from her past and is given orders to track down Charlotte and Faraday in order to stop them from completing their mission -- by any means necessary. Meanwhile, Ben offers Locke an enticing deal.',
          episodeNumber: 6,
          seasonNumber: 4,
          releaseDate: '2008-03-06',
          isSpecialEpisode: false,
          tmdbId: 334005,
        },
        {
          title: 'Ji Yeon',
          description:
            "Juliet is forced to reveal some startling news to Jin when Sun threatens to move to Locke's camp. Meanwhile, Sayid and Desmond begin to get an idea of the freighter's crew when they meet the ship's captain.",
          episodeNumber: 7,
          seasonNumber: 4,
          releaseDate: '2008-03-13',
          isSpecialEpisode: false,
          tmdbId: 334001,
        },
        {
          title: 'Meet Kevin Johnson',
          description:
            "Sayid confronts Ben's spy on the freighter, and Ben urges daughter Alex to flee Locke's camp in order to survive an impending attack.",
          episodeNumber: 8,
          seasonNumber: 4,
          releaseDate: '2008-03-20',
          isSpecialEpisode: false,
          tmdbId: 334006,
        },
        {
          title: 'The Shape of Things to Come',
          description:
            "Jack tries to discover the identity of a body that has washed ashore. Meanwhile, Locke's camp is attacked by Ben's adversaries.",
          episodeNumber: 9,
          seasonNumber: 4,
          releaseDate: '2008-04-24',
          isSpecialEpisode: false,
          tmdbId: 334002,
        },
        {
          title: 'Something Nice Back Home',
          description:
            "Kate and Juliet must learn to work together when Jack's health is seriously compromised, and something goes wrong as Sawyer, Claire, Aaron and Miles continue their trek away from Locke's camp and back to the beach",
          episodeNumber: 10,
          seasonNumber: 4,
          releaseDate: '2008-05-01',
          isSpecialEpisode: false,
          tmdbId: 334003,
        },
        {
          title: 'Cabin Fever',
          description:
            "Locke finds out where Jacob's cabin is. Life on the freighter becomes dangerous.",
          episodeNumber: 11,
          seasonNumber: 4,
          releaseDate: '2008-05-08',
          isSpecialEpisode: false,
          tmdbId: 333999,
        },
        {
          title: "There's No Place Like Home (1)",
          description:
            'Sayid goes back to the island to bring the rest of the people to the freighter. Ben, Locke, and Hurley go to another Dharma station in order to "move the island".',
          episodeNumber: 12,
          seasonNumber: 4,
          releaseDate: '2008-05-15',
          isSpecialEpisode: false,
          tmdbId: 334004,
        },
        {
          title: "There's No Place Like Home (2)",
          description:
            'The face-off between the survivors and the freighter people continues, and the Oceanic Six find themselves closer to rescue.',
          episodeNumber: 13,
          seasonNumber: 4,
          releaseDate: '2008-05-29',
          isSpecialEpisode: false,
          tmdbId: 334007,
        },
        {
          title: "There's No Place Like Home (3)",
          description:
            'As the face-off between the survivors and the freighter people continues, the Oceanic Six find themselves closer to rescue.',
          episodeNumber: 14,
          seasonNumber: 4,
          releaseDate: '2008-05-29',
          isSpecialEpisode: false,
          tmdbId: 334008,
        },
      ],
    },
    {
      tmdbId: 14045,
      title: 'Season 5',
      description:
        'The fifth season of the American serial drama television series Lost commenced airing on the ABC network in the United States and on A in Canada in January 2009, and concluded with a two-hour season finale on May 13, 2009. The season continues the stories of the survivors of the fictional crash of Oceanic Airlines Flight 815, after some of them are rescued and those still stranded seemingly disappear to an unknown location and time with the island that they inhabit.\n\nAccording to Lost\'s co-creator/executive producer/writer/show runner Damon Lindelof, the season "is about why [the people who have left the island] need to get back". Lost returned on January 21, 2009 on ABC with a three-hour premiere consisting of a clip-show and two back-to-back new episodes. The remainder of the season aired on Wednesdays at 9:00 pm EST. The season began in the UK and Ireland on January 25, 2009 on Sky1 and RTÉ Two, respectively. The season was released on DVD and Blu-ray Disc under the title Lost: The Complete Fifth Season – The Journey Back, Expanded Edition on December 8, 2009.',
      poster:
        'https://image.tmdb.org/t/p/original/2OYKA6UIC56loPxgL4IMshg4mVr.jpg',
      seasonNumber: 5,
      numberOfEpisodes: 17,
      releaseDate: '2009-01-21',
      isSpecialSeason: false,
      episodes: [
        {
          title: 'Because You Left',
          description:
            "The remaining island survivors start to feel the effects of the aftermath of moving the island, and Jack and Ben begin their quest to reunite the Oceanic 6 in order to return to the island with Locke's body in an attempt to save their former fellow castaways.",
          episodeNumber: 1,
          seasonNumber: 5,
          releaseDate: '2009-01-21',
          isSpecialEpisode: false,
          tmdbId: 334009,
        },
        {
          title: 'The Lie',
          description:
            'Hurley and Sayid are on the run from the cops after stumbling into trouble at the safehouse; the island survivors come under attack by unknown forces; and an old friend offers some shocking advice to Kate in order to ensure that "the lie" remain a secret.',
          episodeNumber: 2,
          seasonNumber: 5,
          releaseDate: '2009-01-21',
          isSpecialEpisode: false,
          tmdbId: 334012,
        },
        {
          title: 'Jughead',
          description:
            "Desmond looks for a woman who might be the key to helping Faraday stop the island's unpredictable movements through time; Locke finds out who has been attacking the survivors.",
          episodeNumber: 3,
          seasonNumber: 5,
          releaseDate: '2009-01-28',
          isSpecialEpisode: false,
          tmdbId: 334010,
        },
        {
          title: 'The Little Prince',
          description:
            "Kate discovers that someone knows the secret of Aaron's true parental lineage. Meanwhile, the dramatic shifts through time are placing the lives of the remaining island survivors in extreme peril.",
          episodeNumber: 4,
          seasonNumber: 5,
          releaseDate: '2009-02-04',
          isSpecialEpisode: false,
          tmdbId: 334025,
        },
        {
          title: 'This Place Is Death',
          description:
            "Locke shoulders the burden of ending the island's increasingly violent movements through time; Ben is stymied in his efforts to reunite the Oceanic 6 and bring them back to the island.",
          episodeNumber: 5,
          seasonNumber: 5,
          releaseDate: '2009-02-11',
          isSpecialEpisode: false,
          tmdbId: 334011,
        },
        {
          title: '316',
          description:
            'The members of Oceanic 6 discover how to get back to the island, but not all of them want to return.',
          episodeNumber: 6,
          seasonNumber: 5,
          releaseDate: '2009-02-18',
          isSpecialEpisode: false,
          tmdbId: 334019,
        },
        {
          title: 'The Life and Death of Jeremy Bentham',
          description: "Locke's mission off the island as Jeremy is revealed.",
          episodeNumber: 7,
          seasonNumber: 5,
          releaseDate: '2009-02-25',
          isSpecialEpisode: false,
          tmdbId: 334014,
        },
        {
          title: 'LaFleur',
          description:
            'Sawyer perpetuates a lie with some of the other island survivors in order to protect themselves from mistakes of the past.',
          episodeNumber: 8,
          seasonNumber: 5,
          releaseDate: '2009-03-04',
          isSpecialEpisode: false,
          tmdbId: 334013,
        },
        {
          title: 'Namaste',
          description:
            'After meeting old acquaintances Sawyer is forced to continue lying to protect them.',
          episodeNumber: 9,
          seasonNumber: 5,
          releaseDate: '2009-03-18',
          isSpecialEpisode: false,
          tmdbId: 334018,
        },
        {
          title: "He's Our You",
          description:
            'Everyone on the island is at risk when one of the survivors decides to go against them and taking matters into their own hands.',
          episodeNumber: 10,
          seasonNumber: 5,
          releaseDate: '2009-03-25',
          isSpecialEpisode: false,
          tmdbId: 334017,
        },
        {
          title: 'Whatever Happened, Happened',
          description:
            "Kate goes to extreme measures to save Ben's life when Jack refuses to help. Meanwhile, Kate begins to tell the truth about the lie in order to protect Aaron.",
          episodeNumber: 11,
          seasonNumber: 5,
          releaseDate: '2009-04-01',
          isSpecialEpisode: false,
          tmdbId: 334016,
        },
        {
          title: 'Dead Is Dead',
          description:
            'To atone for sins of the past, Ben must attempt to summon the smoke monster in order to be judged.',
          episodeNumber: 12,
          seasonNumber: 5,
          releaseDate: '2009-04-08',
          isSpecialEpisode: false,
          tmdbId: 334015,
        },
        {
          title: 'Some Like It Hoth',
          description:
            "Suspicions about a possible breach intensify after Ben is taken from the infirmary, and a reluctant Miles is forced to work with Hurley when he's asked to deliver an important package to a top Dharma official.",
          episodeNumber: 13,
          seasonNumber: 5,
          releaseDate: '2009-04-15',
          isSpecialEpisode: false,
          tmdbId: 334020,
        },
        {
          title: 'The Variable',
          description:
            'On the 100th episode milestone for the series, the time of reckoning has begun when Daniel Faraday comes clean regarding what he knows about the island.',
          episodeNumber: 14,
          seasonNumber: 5,
          releaseDate: '2009-04-29',
          isSpecialEpisode: false,
          tmdbId: 334021,
        },
        {
          title: 'Follow the Leader',
          description:
            'Jack and Kate find themselves at odds over the direction to take to save their fellow island survivors, Locke further solidifies his stance as leader of "The Others," and Sawyer and Juliet come under scrutiny from the Dharma Initiative.',
          episodeNumber: 15,
          seasonNumber: 5,
          releaseDate: '2009-05-06',
          isSpecialEpisode: false,
          tmdbId: 334022,
        },
        {
          title: 'The Incident (1)',
          description:
            "Jack's decision to put a plan in action in order to set things right on the island is met with some strong resistance by those close to him, and Locke assigns Ben a difficult task.",
          episodeNumber: 16,
          seasonNumber: 5,
          releaseDate: '2009-05-13',
          isSpecialEpisode: false,
          tmdbId: 334024,
        },
        {
          title: 'The Incident (2)',
          description:
            "Jack's decision to put a plan in action in order to set things right on the island is met with some strong resistance by those close to him, and Locke assigns Ben a difficult task.",
          episodeNumber: 17,
          seasonNumber: 5,
          releaseDate: '2009-05-13',
          isSpecialEpisode: false,
          tmdbId: 334023,
        },
      ],
    },
    {
      tmdbId: 14046,
      title: 'Season 6',
      description:
        'After Season 5’s explosive finish, everything is up in the air for the survivors of flight 815. No one knows what — or who — the future will hold. Will Juliet’s sacrifice to save her friends work? Can Kate choose, once and for all, between Jack and Sawyer? Will Sun and Jin be reunited? Is it too late to save Claire? Whatever awaits everyone on the island, one thing is for certain — the moment of truth has arrived.',
      poster:
        'https://image.tmdb.org/t/p/original/xUb57GiEwg6pJpU4F3e01PKRVlc.jpg',
      seasonNumber: 6,
      numberOfEpisodes: 18,
      releaseDate: '2010-02-02',
      isSpecialSeason: false,
      episodes: [
        {
          title: 'LA X (1)',
          description:
            "Two outcomes of the detonation of the hydrogen bomb are presented. Flight 815 lands safely at LAX, where Kate escapes from the marshal and Jack learns that his father's body was lost in transit.",
          episodeNumber: 1,
          seasonNumber: 6,
          releaseDate: '2010-02-02',
          isSpecialEpisode: false,
          tmdbId: 334026,
        },
        {
          title: 'LA X (2)',
          description:
            "The survivors return to the present day after Jacob's death; Juliet dies and Sayid is resurrected after being brought to the Others' temple. Also, the Man in Black, who is impersonating Locke, is revealed to be the Smoke Monster and kills several of Ilana's team from Flight 316.",
          episodeNumber: 2,
          seasonNumber: 6,
          releaseDate: '2010-02-02',
          isSpecialEpisode: false,
          tmdbId: 334027,
        },
        {
          title: 'What Kate Does',
          description:
            'When Sawyer escapes from the temple, Kate and Jin are sent to bring him back. Meanwhile, the Others determine Sayid is infected and attempt to poison him. In the flash sideways, Kate, still on the run, takes Claire to a hospital when she goes into labor.',
          episodeNumber: 3,
          seasonNumber: 6,
          releaseDate: '2010-02-09',
          isSpecialEpisode: false,
          tmdbId: 334028,
        },
        {
          title: 'The Substitute',
          description:
            'On the island, the Man in Black attempts to recruit Sawyer in his attempt to leave the island, while an impromptu funeral is held for the real Locke. In the flash sideways, Locke is fired from his job and becomes a substitute teacher.',
          episodeNumber: 4,
          seasonNumber: 6,
          releaseDate: '2010-02-16',
          isSpecialEpisode: false,
          tmdbId: 334029,
        },
        {
          title: 'Lighthouse',
          description:
            "On Jacob's orders, Hurley leads Jack to a lighthouse. Meanwhile, Claire questions an Other she has captured while tending to an injured Jin. In the flash sideways, Jack is a single father trying to bond with his son.",
          episodeNumber: 5,
          seasonNumber: 6,
          releaseDate: '2010-02-23',
          isSpecialEpisode: false,
          tmdbId: 334030,
        },
        {
          title: 'Sundown',
          description:
            'After recruiting Sayid to his cause, the Man in Black issues an ultimatum to the Others: either join him or die. Meanwhile, Kate is reunited with Claire. In the flash sideways, Sayid helps his brother, who is in debt to a loan shark.',
          episodeNumber: 6,
          seasonNumber: 6,
          releaseDate: '2010-03-02',
          isSpecialEpisode: false,
          tmdbId: 334031,
        },
        {
          title: 'Dr. Linus',
          description:
            "Ilana discovers Ben killed Jacob, so she plans to kill him. Meanwhile, Jack, Hurley and a suicidal Richard visit the Black Rock. In the flash sideways, Ben, a high school teacher, tries to blackmail the school's principal.",
          episodeNumber: 7,
          seasonNumber: 6,
          releaseDate: '2010-03-09',
          isSpecialEpisode: false,
          tmdbId: 334032,
        },
        {
          title: 'Recon',
          description:
            'The Man in Black sends Sawyer on a reconnaissance mission to Hydra Island, where he discovers that Charles Widmore has returned to the island with a team of scientists. In the flash sideways, Sawyer is a lonely cop who is still searching for the original Sawyer.',
          episodeNumber: 8,
          seasonNumber: 6,
          releaseDate: '2010-03-16',
          isSpecialEpisode: false,
          tmdbId: 334033,
        },
        {
          title: 'Ab Aeterno',
          description:
            "Richard Alpert's back story is shown: In 1867, he is brought to the island on the Black Rock as a slave. He makes a deal with Jacob to be his representative in exchange for immortality. In the present day, Hurley convinces him to help the candidates replace Jacob and stop the Man in Black from leaving the Island.",
          episodeNumber: 9,
          seasonNumber: 6,
          releaseDate: '2010-03-23',
          isSpecialEpisode: false,
          tmdbId: 334034,
        },
        {
          title: 'The Package',
          description:
            "After Jin is kidnapped and taken to Hydra Island by Widmore's team, the Man in Black confronts Widmore. On the main island, Sun loses her ability to speak English. In the flash sideways, Sun and Jin are abducted after failing to complete a transaction for Sun's father.",
          episodeNumber: 10,
          seasonNumber: 6,
          releaseDate: '2010-03-30',
          isSpecialEpisode: false,
          tmdbId: 334035,
        },
        {
          title: 'Happily Ever After',
          description:
            'On the island, Widmore subjects Desmond to a large amount of electromagnetic energy as an experiment. In the flash sideways, Desmond, with the aid of Charlie, starts to have visions of his life in the original timeline.',
          episodeNumber: 11,
          seasonNumber: 6,
          releaseDate: '2010-04-06',
          isSpecialEpisode: false,
          tmdbId: 334036,
        },
        {
          title: 'Everybody Loves Hugo',
          description:
            'In order to prevent more loss of life, Hurley leads the other survivors to speak with the Man in Black. In the flash sideways, Hurley meets Libby, while Desmond continues his mission to let the Oceanic 815 passengers know of their lives on the island.',
          episodeNumber: 12,
          seasonNumber: 6,
          releaseDate: '2010-04-13',
          isSpecialEpisode: false,
          tmdbId: 334037,
        },
        {
          title: 'The Last Recruit',
          description:
            "The survivors split into two groups; one led by Sawyer, the other by the Man in Black. Sawyer's group travels to Hydra Island, where they are captured by Widmore's crew after Sun and Jin are reunited. In the flash sideways, the passengers of Oceanic 815 continue to cross paths with each other.",
          episodeNumber: 13,
          seasonNumber: 6,
          releaseDate: '2010-04-20',
          isSpecialEpisode: false,
          tmdbId: 334038,
        },
        {
          title: 'The Candidate',
          description:
            "After the remaining survivors are reunited, Sawyer and Jack hatch a plan to divert the Man in Black's attention and leave the island without him on Widmore's submarine, but disastrous consequences await them. In the flash sideways, Jack investigates the cause of Locke's paralysis and offers treatment.",
          episodeNumber: 14,
          seasonNumber: 6,
          releaseDate: '2010-05-04',
          isSpecialEpisode: false,
          tmdbId: 334039,
        },
        {
          title: 'Across the Sea',
          description:
            "Jacob and the Man in Black are revealed to be twin brothers. They are raised by a mysterious woman who is charged with protecting the island. As revenge for the murder of their adoptive mother (who killed their real mother), Jacob throws his brother into the source of electromagnetism after being made the island's guardian, which transforms the Man in Black into the smoke monster.",
          episodeNumber: 15,
          seasonNumber: 6,
          releaseDate: '2010-05-11',
          isSpecialEpisode: false,
          tmdbId: 334040,
        },
        {
          title: 'What They Died For',
          description:
            "Ben finally takes his revenge on Widmore after accepting the Man in Black's request for assistance. Jacob explains the purpose of the candidates, and Jack volunteers to take his place. The search for Desmond reveals that he has been rescued and the Man in Black plans to use him to destroy the island. In the flash sideways, each person ends up on their way to a concert.",
          episodeNumber: 16,
          seasonNumber: 6,
          releaseDate: '2010-05-18',
          isSpecialEpisode: false,
          tmdbId: 334041,
        },
        {
          title: 'The End (1)',
          description:
            'For different reasons, Jack and the Man in Black both use Desmond to extinguish the light at the heart of the island. The island starts disintegrating, but The Man in Black is also made mortal. Still desperate to escape, The Man in Black fights Jack and mortally wounds him, but with help from Kate, Jack kills him. Realizing his destiny, Jack sacrifices himself to relight the heart of the island, so his friends can escape on the Ajira plane. Hurley takes Jack\'s place as protector of the island and makes Ben the new advisor. The flash sideways is revealed to be a type of limbo, or holding pattern, for the main characters, where they reside until accepting their life and death, and are then able to "let go" and "move on" together.',
          episodeNumber: 17,
          seasonNumber: 6,
          releaseDate: '2010-05-23',
          isSpecialEpisode: false,
          tmdbId: 334042,
        },
        {
          title: 'The End (2)',
          description:
            'For different reasons, Jack and the Man in Black both use Desmond to extinguish the light at the heart of the island. The island starts disintegrating, but The Man in Black is also made mortal. Still desperate to escape, The Man in Black fights Jack and mortally wounds him, but with help from Kate, Jack kills him. Realizing his destiny, Jack sacrifices himself to relight the heart of the island, so his friends can escape on the Ajira plane. Hurley takes Jack\'s place as protector of the island and makes Ben the new advisor. The flash sideways is revealed to be a type of limbo, or holding pattern, for the main characters, where they reside until accepting their life and death, and are then able to "let go" and "move on" together.',
          episodeNumber: 18,
          seasonNumber: 6,
          releaseDate: '2010-05-23',
          isSpecialEpisode: false,
          tmdbId: 334043,
        },
      ],
    },
  ],
  needsDetails: false,
};
