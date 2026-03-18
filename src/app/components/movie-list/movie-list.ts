import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieRatingService, Movie } from '../../services/movie-rating';


@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.html',
  styleUrls: ['./movie-list.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class MovieListComponent {
  movies = signal<Movie[]>([]);
  title = '';
  year!: number;
  genres: string[] = [];
  rating = 1;
  selectedGenre = '';
  isOwner = signal(false);

  errorMessage = signal<string | null>(null);

  selectedCategory = signal<string | null>(null);
  searchTerm = signal('');

  constructor(private movieService: MovieRatingService) {}


  async ngOnInit() {
    this.genres = this.movieService.genres;
    this.selectedGenre = this.genres[0];
    await this.loadMovies();
    await this.checkOwner();

    

  // if ((window as any).ethereum) {
  //   (window as any).ethereum.on('accountsChanged', async () => {
  //     this.isOwner.set(false)
  //     await this.checkOwner();
  //     await this.loadMovies();
  //   });
  // }

  }
  
  ngOnDestroy() {
  if ((window as any).ethereum?.removeListener) {
    (window as any).ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
  }
}

      handleAccountsChanged = async () => {
      this.isOwner.set(false);
      await this.checkOwner();
      await this.loadMovies();
    };

    
    setCategory(category: string | null) {
      this.selectedCategory.set(category);
      this.updateFilteredMovies();
    }

    onSearchChange(value: string) {
      this.searchTerm.set(value);
      this.updateFilteredMovies();
    }

  async checkOwner() {
  const signer = await this.movieService.getSignerAddress();
  const owner = await this.movieService.getOwnerAddress();

  this.isOwner.set(signer.toLowerCase() === owner.toLowerCase());
}


  async loadMovies() {
    this.movies.set(await this.movieService.getMovies());
    this.updateFilteredMovies();
  }

  async addMovie() {
    const owner = await this.movieService.getOwnerAddress();
    const signer = await this.movieService.getSignerAddress();

    console.log("Owner:", owner);
    console.log("Current user:", signer);

    const isOwner = signer.toLowerCase() === owner.toLowerCase();

    if (!isOwner) {
    this.errorMessage.set("❌ Only the contract owner can add movies.\n\n👉 Please switch account in MetaMask.");
    return;
    
    
    }
    try {
      await this.movieService.addMovie(this.title, this.year, this.selectedGenre);
      this.title = '';
      this.year = 0;
      this.selectedGenre = this.genres[0];
      await this.loadMovies();
      
    } catch (err) {
      console.error(err);
      alert("❌ Transaction failed");
    }
  }

  filteredMovies = signal<Movie[]>([]);

  updateFilteredMovies() {
    const movies = this.movies();

    const category = this.selectedCategory();
    const search = this.searchTerm().toLowerCase();

    const filtered = movies.filter(movie => {
      const matchCategory = !category || movie.genre === category;

      const matchSearch =
        !search ||
        movie.title.toLowerCase().includes(search) ||
        movie.genre.toLowerCase().includes(search);

      return matchCategory && matchSearch;
    });

    this.filteredMovies.set(filtered);
  }

  async rateMovie(index: number, ratingValue: number) {
    await this.movieService.rateMovie(index, ratingValue);
    await this.loadMovies();
  }

  async removeMovie(movieId: number) {
    await this.movieService.removeMovie(movieId);
    await this.loadMovies();
  }
}