import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieRatingService, Movie } from '../../services/movie-rating';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.html',
  styleUrls: ['./movie-list.css'],
  standalone: true,            // if your component is standalone
  imports: [CommonModule, FormsModule], // <-- ADD THESE
})
export class MovieListComponent {
  movies = signal<Movie[]>([]);
  title = '';
  year!: number;
  rating = 1;

  constructor(private movieService: MovieRatingService) {}

  async ngOnInit() {
    await this.loadMovies();
  }

  async loadMovies() {
    this.movies.set(await this.movieService.getMovies());
  }

  async addMovie() {
    await this.movieService.addMovie(this.title, this.year);
    this.title = '';
    this.year = 0;
    await this.loadMovies();
  }

  async rateMovie(index: number, ratingValue: number) {
    await this.movieService.rateMovie(index, this.rating);
    await this.loadMovies();
  }
}