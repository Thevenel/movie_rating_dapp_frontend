import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import MovieRatingJson from '../../assets/MovieRating.json';
import { environment } from '../../environments/environment';

export type Movie = {
  id: number;
  title: string;
  year: number;
  totalRating: number;
  ratingCount: number;
  canRate? : boolean;
};

@Injectable({
  providedIn: 'root'
})
export class MovieRatingService {
  private provider!: ethers.BrowserProvider;
  private contract!: ethers.Contract;

  constructor() {
    this.init();
  }

  

async init() {
  if ((window as any).ethereum) {
    this.provider = new ethers.BrowserProvider((window as any).ethereum);
    await this.provider.send("eth_requestAccounts", []); // prompt MetaMask
    const signer = await this.provider.getSigner();
    const contractAddress = environment.contractAddress; // <-- UPDATE THIS
    this.contract = new ethers.Contract(contractAddress, MovieRatingJson.abi, signer);
  } else {
    alert('Please install MetaMask!');
  }
  const network = (await this.provider.getNetwork());
  console.log("Network Name:", network.name);
  console.log("Network Chain ID:", network.chainId);
  console.log("Network Plugins:", network.plugins);
  console.log("Contract:", this.contract.target);

  const code = await this.provider.getCode(this.contract.target);
  console.log("Code at address:", code);
}


  private async waitForInit() {
    while (!this.contract) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async addMovie(title: string, year: number) {
    await this.waitForInit();
    const tx = await this.contract['addMovie'](title, year);
    await tx.wait();
  }

  async rateMovie(index: number, rating: number) {
    await this.waitForInit();
    const tx = await this.contract['rateMovie'](index, rating);
    await tx.wait();
  }


async getMovies(): Promise<Movie[]> {
  await this.waitForInit();
  const raw: any[] = await this.contract['getMovies']();
  const userAddress = await (await this.provider.getSigner()).getAddress();
  console.log("Raw movies:", raw);
  return Promise.all(raw.map(async (m, index) =>{
    const alreadyRated = await this.contract['hasRated'](index, userAddress);
    return {
    id: Number(m.id ?? index),
    title: m.title,
    year: Number(m.year),
    totalRating: Number(m.totalRating),
    ratingCount: Number(m.ratingCount),
    canRate : !alreadyRated
  };
}));
}

}