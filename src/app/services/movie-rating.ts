import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import MovieRatingJson from '../../assets/MovieRating.json';
import { environment } from '../../environments/environment';

export type Movie = {
  id: number;
  title: string;
  year: number;
  genre: string;
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

  readonly genres = [
    'Action','Comedy','Drama','Horror','SciFi','Romance','Thriller','Documentary',
    'Animation','Fantasy','Mystery','Adventure','Musical','Western','Historical',
    'War','Crime','Family','Sports','Biography','Other'
  ];

  constructor() {
    this.init();
  }

  
async init() {
  if (!(window as any).ethereum) return alert('Please install MetaMask');
  await (window as any).ethereum.request({
    method: 'eth_requestAccounts',
  });

  this.provider = new ethers.BrowserProvider((window as any).ethereum);
  const network = await this.provider.getNetwork();

  const expectedChainId = BigInt(environment.chainId);

  if (network.chainId !== expectedChainId) {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: environment.chainId }], 
      });
      window.location.reload();
    } catch (err) {
      alert(`Please switch MetaMask to ${environment.production ? 'Sepolia' : 'Ganache'}`);
    }
  }

  const signer = await this.provider.getSigner();
  this.contract = new ethers.Contract(environment.contractAddress, MovieRatingJson.abi, signer);

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

  async addMovie(title: string, year: number, genre:string) {
    await this.waitForInit();
    const genreIndex = this.genres.indexOf(genre);
    if (genreIndex === -1) {
       new Error("Invalid genre selected");
    }
    const tx = await this.contract['addMovie'](title, year, genreIndex);
    await tx.wait();
  }

  async rateMovie(index: number, rating: number) {
  await this.waitForInit();

  try {
    const tx = await this.contract['rateMovie'](index, rating);
    await tx.wait();

  } catch (error) {
    console.error("Transaction Failed:", error);
  }

}

async removeMovie(movieId: number) {
  await this.waitForInit();
  const tx = await this.contract['removeMovie'](movieId);
  await tx.wait();
}

async getMovies(): Promise<Movie[]> {
  await this.waitForInit();
  const readOnlyContract = new ethers.Contract(
    environment.contractAddress, 
    MovieRatingJson.abi, 
    this.provider
  );

  const raw: any[] = await readOnlyContract['getMovies']();

  const signer = await this.provider.getSigner();
  const userAddress = await signer.getAddress();

  return Promise.all(raw.map(async (m) => {
    const movieId = Number(m.id);
    const alreadyRated = await readOnlyContract['hasRated'](movieId, userAddress);
    
    return {
      id: movieId,
      title: m.title,
      year: Number(m.year),
      genre: this.genres[m.genre] ?? "Unknown",
      totalRating: Number(m.totalRating),
      ratingCount: Number(m.ratingCount),
      canRate: !alreadyRated
    };
  }));
}
async getSignerAddress(): Promise<string> {
  const signer = await this.provider.getSigner();
  return signer.getAddress();
}

async getOwnerAddress(): Promise<string> {
  await this.waitForInit();

  const readOnlyContract = new ethers.Contract(
    environment.contractAddress,
    MovieRatingJson.abi,
    this.provider
  );

  return await readOnlyContract['owner']();
}
}