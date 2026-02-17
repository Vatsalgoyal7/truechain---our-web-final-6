
import { jsPDF } from "jspdf";
import { Product, HarvestBatch } from "../types";

const urlToDataUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to convert URL to DataURL:", error);
    throw error;
  }
};

export const generateFarmerManifestPDF = async (batch: HarvestBatch) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const manifest = batch.genesisManifest?.farmerManifest;

  // Header
  doc.setFillColor(6, 78, 59); // Emerald-900
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("FARMER SUPPLY CHAIN MANIFEST", 20, 25);
  doc.setFontSize(9);
  doc.text(`Blockchain Genesis Node: ${batch.id}`, 20, 33);
  doc.text(`Anchored Timestamp: ${new Date().toLocaleString()} | TrueChain V1.0`, 20, 38);

  // SECTION 1: Farmer Identity
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("1. Farmer Identity & Geography", 20, 60);
  doc.line(20, 63, pageWidth - 20, 63);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${batch.farmerName}`, 20, 72);
  doc.text(`Verified Node ID: ${batch.farmerId}`, 20, 79);
  doc.text(`Region: ${manifest?.identity.village || 'N/A'}, ${manifest?.identity.district || 'N/A'}, ${manifest?.identity.state || 'N/A'}`, 20, 86);
  doc.text(`Immutable GPS: ${batch.location.address}`, 20, 93);

  // SECTION 2: Land & Production Environment
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("2. Land & Environmental Audit", 20, 110);
  doc.line(20, 113, pageWidth - 20, 113);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Land Size: ${manifest?.land.size || 'N/A'} Acres`, 20, 122);
  doc.text(`Soil Composition: ${manifest?.land.soilType || 'N/A'}`, 100, 122);
  doc.text(`Water Management: ${manifest?.land.waterSource || 'N/A'} System`, 20, 129);
  doc.text(`Pollution Risk Index: ${manifest?.land.pollutionRisk || 'Low Verified'}`, 100, 129);
  
  doc.text(`Weather History during cycle: ${manifest?.environment.weatherHistory || 'Stable Cycle'}`, 20, 138, { maxWidth: 170 });
  doc.text(`Average Temp Range: ${manifest?.environment.tempRange || '22-30°C'}`, 20, 145);

  // SECTION 3: Asset Specifics
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("3. Agricultural Specifics", 20, 160);
  doc.line(20, 163, pageWidth - 20, 163);

  doc.setFontSize(11);
  doc.text(`Product Type: ${batch.cropName} (${batch.category})`, 20, 172);
  doc.setFont("helvetica", "normal");
  doc.text(`Seed Traceability: ${manifest?.seedType || 'Organic'} (Source: ${manifest?.seedSource || 'Regional'})`, 20, 179);
  doc.text(`Cycle Window: ${manifest?.sowingMonth || 'June'} - ${manifest?.harvestingMonth || 'Oct'}`, 20, 186);
  doc.text(`Input Management: ${manifest?.pesticideUsage || 'None'} fertilizers/pesticides`, 20, 193);
  doc.text(`Storage Protocol: ${manifest?.storageMethod || 'Ambient'}`, 20, 200);

  // Dairy Details (Conditional)
  if (manifest?.dairy) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("4. Dairy Node Specifics", 20, 215);
    doc.line(20, 218, pageWidth - 20, 218);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Animal Type: ${manifest.dairy.animalType} (Breed: ${manifest.dairy.breed})`, 20, 227);
    doc.text(`Yield/Day: ${manifest.dairy.yieldPerDay} Liters`, 120, 227);
    doc.text(`Antibiotics Usage: ${manifest.dairy.antibiotics}`, 20, 234);
    doc.text(`Hygiene Audit: ${manifest.dairy.hygieneProcess}`, 20, 241, { maxWidth: 170 });
  }

  // Blockchain Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 270, pageWidth, 27, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont("courier", "bold");
  doc.text(`BLOCKCHAIN_TX_HASH: ${batch.blockchainHash}`, pageWidth / 2, 280, { align: 'center' });
  doc.setFont("helvetica", "normal");
  doc.text("TRUECHAIN PROVENANCE NETWORK - IMMUTABLE RECORD", pageWidth / 2, 288, { align: 'center' });

  doc.save(`TrueChain_Manifest_${batch.id}.pdf`);
};

export const generateTrustCardPDF = async (product: Product) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=truechain://${product.id}`;
  const primaryColor = [31, 122, 90]; 
  const textColor = [15, 23, 42]; 

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 60, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("TRUECHAIN TRUST CARD", 105, 30, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("OFFICIAL BLOCKCHAIN PROVENANCE CERTIFICATE", 105, 40, { align: 'center' });

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(product.name.toUpperCase(), 105, 85, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Blockchain ID: ${product.id}`, 105, 95, { align: 'center' });

  try {
    const qrDataUrl = await urlToDataUrl(qrUrl);
    doc.addImage(qrDataUrl, 'PNG', 75, 115, 60, 60);
  } catch (e) {}

  doc.setFontSize(14);
  doc.text("CERTIFICATION STATUS", 105, 210, { align: 'center' });
  doc.setFontSize(26);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(product.certification.status.toUpperCase(), 105, 225, { align: 'center' });
  
  doc.setTextColor(148, 163, 184);
  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.text(`IMMUTABLE HASH: ${product.blockchainHash}`, 105, 280, { align: 'center' });

  doc.save(`truechain-trust-card-${product.id.toLowerCase()}.pdf`);
};

export const generateProductPDF = (product: Product, batch?: HarvestBatch) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(16, 185, 129); 
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("TRUECHAIN PROVENANCE REPORT", 20, 25);

  doc.setTextColor(30, 41, 59); 
  doc.setFontSize(12);
  doc.text(`Name: ${product.name}`, 20, 60);
  doc.text(`Trust Score: ${product.certification.matchPercentage.toFixed(1)}%`, 20, 70);

  if (batch) {
    doc.text("Agricultural Sourcing Manifest Linked", 20, 90);
    doc.text(`Farmer: ${batch.farmerName} | Batch ID: ${batch.id}`, 20, 100);
  }

  doc.save(`TrueChain_Report_${product.id}.pdf`);
};

export const generateCollectionPDF = (userName: string, savedItems: (Product | HarvestBatch)[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42); 
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("VERIFIED COLLECTION REPORT", 20, 25);

  let yPos = 70;
  savedItems.forEach((item, index) => {
    const isProduct = 'certification' in item;
    const itemName = isProduct ? (item as Product).name : (item as HarvestBatch).cropName;
    doc.text(`${index + 1}. ${itemName}`, 20, yPos);
    yPos += 15;
  });

  doc.save(`TrueChain_Collection_${userName.replace(/\s+/g, '_')}.pdf`);
};
