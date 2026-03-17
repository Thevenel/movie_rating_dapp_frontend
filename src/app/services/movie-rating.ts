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
  userRating? : number;
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
  if (!(window as any).ethereum) return alert('Please install MetaMask');

  this.provider = new ethers.BrowserProvider((window as any).ethereum);
  const network = await this.provider.getNetwork();
  
  // Convert environment hex to BigInt for comparison
  const expectedChainId = BigInt(environment.chainId);

  if (network.chainId !== expectedChainId) {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: environment.chainId }], 
      });
      // Reload the page after switching to reset the state
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


//   async init() {
//   if ((window as any).ethereum) {
//     this.provider = new ethers.BrowserProvider((window as any).ethereum);
//     await this.provider.send("eth_requestAccounts", []); // prompt MetaMask
//     const signer = await this.provider.getSigner();
//     const contractAddress = environment.contractAddress; // <-- UPDATE THIS
//     this.contract = new ethers.Contract(contractAddress, MovieRatingJson.abi, signer);
//   } else {
//     alert('Please install MetaMask!');
//   }
//   const network = (await this.provider.getNetwork());
//   console.log("Network Name:", network.name);
//   console.log("Network Chain ID:", network.chainId);
//   console.log("Network Plugins:", network.plugins);
//   console.log("Contract:", this.contract.target);

//   const code = await this.provider.getCode(this.contract.target);
//   console.log("Code at address:", code);
// }


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

  // async rateMovie(index: number, rating: number) {
  //   await this.waitForInit();
  //   const tx = await this.contract['rateMovie'](index, rating);
  //   await tx.wait();
  // }

  async rateMovie(index: number, rating: number) {
  await this.waitForInit();
  
  
  // DEBUG LOGS
  console.log("--- Attempting to Rate Movie ---");
  console.log("Movie Index (ID):", index);
  console.log("Rating Value being sent:", rating);
  console.log("Type of Rating:", typeof rating);


  try {
    const tx = await this.contract['rateMovie'](index, rating);
    console.log("Transaction sent! Hash:", tx.hash);
    
    await tx.wait();
    console.log("Transaction Confirmed!");
  } catch (error) {
    console.error("Transaction Failed:", error);
  }
}


// async getMovies(): Promise<Movie[]> {
//   await this.waitForInit();
//   const raw: any[] = await this.contract['getMovies']();
//   const userAddress = await (await this.provider.getSigner()).getAddress();
//   console.log("Raw movies:", raw);
//   return Promise.all(raw.map(async (m, index) =>{
//     const alreadyRated = await this.contract['hasRated'](index, userAddress);
//     return {
//     id: Number(m.id ?? index),
//     title: m.title,
//     year: Number(m.year),
//     totalRating: Number(m.totalRating),
//     ratingCount: Number(m.ratingCount),
//     canRate : !alreadyRated
//   };
// }));
// }

async getMovies(): Promise<Movie[]> {
  await this.waitForInit();

  // FIX 1: Explicitly use the provider for "View" calls
  const readOnlyContract = new ethers.Contract(
    environment.contractAddress, 
    MovieRatingJson.abi, 
    this.provider // Use provider, not signer
  );

  const raw: any[] = await readOnlyContract['getMovies']();
  
  // FIX 2: Get the user address once outside the loop
  const signer = await this.provider.getSigner();
  const userAddress = await signer.getAddress();

  return Promise.all(raw.map(async (m, index) => {
    // FIX 3: Ensure index is handled as a number
    const alreadyRated = await readOnlyContract['hasRated'](index, userAddress);
    
    return {
      id: Number(m.id),
      title: m.title,
      year: Number(m.year),
      totalRating: Number(m.totalRating),
      ratingCount: Number(m.ratingCount),
      canRate: !alreadyRated,
      userRating: 1
    };
  }));
}
}