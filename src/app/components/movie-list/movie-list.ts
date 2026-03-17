import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieRatingService, Movie } from '../../services/movie-rating';
import { environment } from '../../../environments/environment';

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
  constructor(private movieService: MovieRatingService) {}


  async ngOnInit() {
    this.genres = this.movieService.genres;
    this.selectedGenre = this.genres[0];
    await this.loadMovies();
    await this.checkOwner();

  if ((window as any).ethereum) {
    (window as any).ethereum.on('accountsChanged', async () => {
      this.isOwner.set(false)
      await this.checkOwner();
      await this.loadMovies();
    });
  }
  }

  async checkOwner() {
  const signer = await this.movieService.getSignerAddress();
  const owner = await this.movieService.getOwnerAddress();

  this.isOwner.set(signer.toLowerCase() === owner.toLowerCase());
}


  async loadMovies() {
    this.movies.set(await this.movieService.getMovies());
  }

  async addMovie() {
    const owner = await this.movieService.getOwnerAddress();
    const signer = await this.movieService.getSignerAddress();

    console.log("Owner:", owner);
    console.log("Current user:", signer);

    const isOwner = signer.toLowerCase() === owner.toLowerCase();

    if (!isOwner) {
    alert("❌ Only the contract owner can add movies.\n\n👉 Please switch account in MetaMask.");
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

  async rateMovie(index: number, ratingValue: number) {
    await this.movieService.rateMovie(index, ratingValue);
    await this.loadMovies();
  }

  async removeMovie(movieId: number) {
    await this.movieService.removeMovie(movieId);
    await this.loadMovies();
  }
}