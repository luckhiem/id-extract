const dropArea = document.querySelector('.drag-area');
const dragText = document.querySelector('.header');

let button = dropArea.querySelector('.button');
let input = dropArea.querySelector('input');

let file = null;
let dataExtracted = [];
let extractionHistory = [];

let menu_btn =  document.querySelector("#menu-btn");
let sidebar = document.querySelector(".sidebar");
let search_btn = document.querySelector(".bx-search-alt-2");
let imgForm = document.querySelector(".get_img");

menu_btn.onclick = function(){
  sidebar.classList.toggle("active");
}

search_btn.onclick = function(){
  sidebar.classList.toggle("active");
}


button.onclick = () => {
  input.click();
};

function loading_on() {
  document.querySelector('.overlay').style.display = "block";
}

function loading_off() {
  document.querySelector('.overlay').style.display = "none";
}

// when browse
input.addEventListener('change', function () {
  file = this.files[0];
  dropArea.classList.add('active');
  displayFile();
});

// when file is inside drag area
dropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropArea.classList.add('active');
  dragText.textContent = 'Release to Upload';
  // console.log('File is inside the drag area');
});

// when file leave the drag area
dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('active');
  // console.log('File left the drag area');
  dragText.textContent = 'Drag & Drop';
});

// when file is dropped
dropArea.addEventListener('drop', (event) => {
  event.preventDefault();
  file = event.dataTransfer.files[0]; // grab single file even of user selects multiple files
  displayFile();
});

// imgForm.addEventListener("submit", function(e) {
//   e.preventDefault();
//   if (file == null){
//     Swal.fire({
//       icon: 'error',
//       title: 'Oops...',
//       text: 'Please upload your image first!'
//     })
//   }
//   else{
//     loading_on()
//     const formData = new FormData();
//     formData.append('file', file);
//     const xhr = new XMLHttpRequest();

//     xhr.onreadystatechange = function() {
//       if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
//         loading_off()
//           // window.alert(xhr.readyState)
//         const data = JSON.parse(xhr.responseText).data;
//         const update =  new Date();
//         document.querySelector('.person__img').innerHTML = `<img src="/static/crop/0.jpg?v=${update.getTime()}" />`; // To update avoid using image from cache
//         document.querySelector('.info__id').innerHTML = `Số (ID): ${data[0]}`;
//         document.querySelector('.info__name').innerHTML = `Họ và tên (Full name): ${data[1]}`;
//         document.querySelector('.info__date').innerHTML = `Ngày sinh (Date of birth): ${data[2]}`;
//         document.querySelector('.info__sex').innerHTML = `Giới tính (Sex): ${data[3]}`;
//         document.querySelector('.info__nation').innerHTML = `Quốc tịch (Nationality): ${data[4]}`;
//         document.querySelector('.info__hometown').innerHTML = `Quê quán (Place of origin): ${data[5]}`;
//         document.querySelector('.info__address').innerHTML = `Nơi thường trú (Place of residence): ${data[6]}`;
//         document.querySelector('.info__doe').innerHTML = `Ngày hết hạn (Date of expiry) : ${data[7]}`;
//         dataExtracted = [{
//           id: data[0],
//           name: data[1],
//           date_of_birth: data[2],
//           sex: data[3],
//           nationality: data[4],
//           hometown: `"${data[5]}"`,
//           address: `"${data[6]}"`,
//           date_of_expiry: data[7]
//         }];
//         Swal.fire({
//           icon: 'success',
//           title: 'Success',
//           text: 'Extract successfully!',
//           footer: `CODE: ${xhr.status}`
//         })
//       }
//       else if (xhr.status >= 400 && xhr.status <= 500){
//         const data = JSON.parse(xhr.responseText);
//         loading_off();
//         Swal.fire({
//           icon: 'error',
//           title: 'Oops...',
//           text: String(data.message),
//           footer: `CODE: ${xhr.status}`
//         })
//       }
//     }
//   const URL = '/uploader';
//   xhr.open('POST', URL, true);
//   xhr.send(formData);
//   }
// });

const xhr = new XMLHttpRequest();
xhr.onreadystatechange = function(e) {
  e.preventDefault();

  if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
    loading_off();
    const data = JSON.parse(xhr.responseText).data;
    const update =  new Date();
    document.querySelector('.person__img').innerHTML = `<img src="/static/results/0.jpg?v=${update.getTime()}" />`; // To update avoid using image from cache
    document.querySelector('.info__id').innerHTML = `Số (ID): ${data[0]}`;
    document.querySelector('.info__name').innerHTML = `Họ và tên (Full name): ${data[1]}`;
    document.querySelector('.info__date').innerHTML = `Ngày sinh (Date of birth): ${data[2]}`;
    document.querySelector('.info__sex').innerHTML = `Giới tính (Sex): ${data[3]}`;
    document.querySelector('.info__nation').innerHTML = `Quốc tịch (Nationality): ${data[4]}`;
    document.querySelector('.info__hometown').innerHTML = `Quê quán (Place of origin): ${data[5]}`;
    document.querySelector('.info__address').innerHTML = `Nơi thường trú (Place of residence): ${data[6]}`;
    document.querySelector('.info__doe').innerHTML = `Ngày hết hạn (Date of expiry) : ${data[7]}`;
    dataExtracted = [{
      id: data[0],
      name: data[1],
      date_of_birth: data[2],
      sex: data[3],
      nationality: data[4],
      hometown: data[5],
      address: data[6],
      date_of_expiry: data[7]
    }];
    
    // Add to history
    addToHistory(data);
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Extract successfully!',
      footer: `CODE: ${xhr.status}`
    })
  }
  else if (xhr.status >= 400 && xhr.status <= 500){
    const data = JSON.parse(xhr.responseText);
    loading_off();
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: String(data.message),
      footer: `CODE: ${xhr.status}`
    })
  }
  else if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 201){
    downloadExtracted();
  }
}

function file_validation(){
  if (file == 'wrong_exts'){
    const URL = '/uploader';
    const formData = new FormData();
    var f = new File([""], "WRONG_EXTS"); // Empty file trick
    formData.append('file', f);
    xhr.open('POST', URL, true);
    xhr.send(formData);
  }
}

imgForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const formData = new FormData();
  loading_on();

  if (file == null){
    var f = new File([""], "NULL"); // Empty file trick
    formData.append('file', f);
  }
  else{
    formData.append('file', file);
  }
  const URL = '/uploader';
  xhr.open('POST', URL, true);
  xhr.send(formData);
});

// Add SheetJS library for Excel generation
function loadSheetJS() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      resolve(window.XLSX);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

convertArrayOfObjectsToExcel = async (args) => {
  const data = args.data;
  if (!data || !data.length) return;

  try {
    const XLSX = await loadSheetJS();
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 15 }, // ID Number
      { wch: 25 }, // Full Name
      { wch: 15 }, // Date of Birth
      { wch: 10 }, // Sex
      { wch: 15 }, // Nationality
      { wch: 30 }, // Place of Origin
      { wch: 40 }, // Place of Residence
      { wch: 15 }  // Date of Expiry
    ];
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "ID Data");
    
    return wb;
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return null;
  }
}

downloadExcel = async (args) => {
  const wb = await convertArrayOfObjectsToExcel({
    data: args.data
  });
  
  if (!wb) {
    console.error('Failed to generate Excel file');
    return;
  }

  const filename = args.filename || 'extracted_data.xlsx';

  try {
    // Generate Excel file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    // Fallback to CSV if Excel fails
    downloadCSV({ filename: filename.replace('.xlsx', '.csv') });
  }
}

function downloadExtracted(){
  // Use Excel generation instead of CSV
  downloadExcel({
    data: dataExtracted,
    filename: "extracted_data.xlsx"
  });
  
  // Show success message
  const downloadSuccess = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  })

  downloadSuccess.fire({
    icon: 'success',
    title: 'Download Excel file successfully!'
  })
}

function displayFile() {
  let fileType = file.type;
  // console.log(fileType);

  let validExtensions = ['image/jpeg', 'image/jpg', 'image/png'];

  if (validExtensions.includes(fileType)) {
    // console.log('This is an image file');
    let fileReader = new FileReader();

    fileReader.onload = () => {
      let fileURL = fileReader.result;
      // console.log(fileURL);
      // let imgTag = `<img src="${fileURL}" alt="">
      //               <button id='close'>close</button>`;
      let imgTag = `<img src="${fileURL}" alt="">`;
      // let removeBtn = `<button id='close'>close</button>`;
      dropArea.innerHTML = imgTag;
      // dropArea.innerHTML = removeBtn;
    };
    fileReader.readAsDataURL(file);
  } else {
    dropArea.classList.remove('active');
    file = 'wrong_exts';
    file_validation();
    file = null;
  }
}

// Initialize history from localStorage
function initializeHistory() {
  const savedHistory = localStorage.getItem('idExtractionHistory');
  if (savedHistory) {
    extractionHistory = JSON.parse(savedHistory);
  }
}

// Save history to localStorage
function saveHistory() {
  localStorage.setItem('idExtractionHistory', JSON.stringify(extractionHistory));
}

// Add new extraction to history
function addToHistory(data) {
  const extraction = {
    id: data[0],
    name: data[1],
    date_of_birth: data[2],
    sex: data[3],
    nationality: data[4],
    hometown: data[5],
    address: data[6],
    date_of_expiry: data[7],
    timestamp: new Date().toISOString(),
    extraction_date: new Date().toLocaleString()
  };
  
  extractionHistory.unshift(extraction); // Add to beginning of array
  
  // Keep only last 100 extractions to prevent localStorage overflow
  if (extractionHistory.length > 100) {
    extractionHistory = extractionHistory.slice(0, 100);
  }
  
  saveHistory();
  updateHistoryDisplay();
}

// Update history display in UI
function updateHistoryDisplay() {
  const historyContainer = document.getElementById('historyContainer');
  if (!historyContainer) return;
  
  if (extractionHistory.length === 0) {
    historyContainer.innerHTML = '<p class="no-history">No extraction history available.</p>';
    return;
  }
  
  let historyHTML = '<div class="history-list">';
  extractionHistory.forEach((item, index) => {
    historyHTML += `
      <div class="history-item">
        <div class="history-header">
          <span class="history-name">${item.name || 'Unknown'}</span>
          <span class="history-date">${item.extraction_date}</span>
          <button class="btn-remove-history" onclick="removeFromHistory(${index})">Remove</button>
        </div>
        <div class="history-details">
          <span><strong>ID:</strong> ${item.id || 'N/A'}</span>
          <span><strong>DOB:</strong> ${item.date_of_birth || 'N/A'}</span>
          <span><strong>Sex:</strong> ${item.sex || 'N/A'}</span>
        </div>
      </div>
    `;
  });
  historyHTML += '</div>';
  
  historyContainer.innerHTML = historyHTML;
}

// Remove item from history
function removeFromHistory(index) {
  extractionHistory.splice(index, 1);
  saveHistory();
  updateHistoryDisplay();
}

// Clear all history
function clearAllHistory() {
  if (confirm('Are you sure you want to clear all extraction history?')) {
    extractionHistory = [];
    saveHistory();
    updateHistoryDisplay();
    Swal.fire({
      icon: 'success',
      title: 'History Cleared',
      text: 'All extraction history has been cleared.',
      timer: 2000
    });
  }
}

// Download complete history
function downloadHistory() {
  if (extractionHistory.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No History',
      text: 'No extraction history available to download.'
    });
    return;
  }
  
  downloadExcel({
    data: extractionHistory,
    filename: `extraction_history_${new Date().toISOString().split('T')[0]}.xlsx`
  });
  
  Swal.fire({
    icon: 'success',
    title: 'History Downloaded',
    text: `Downloaded ${extractionHistory.length} extraction records.`,
    timer: 2000
  });
}

// Function to handle new image upload
function uploadNewImage() {
  // Reset the file input
  input.value = '';
  
  // Reset the drag area to its original state
  dropArea.classList.remove('active');
  dropArea.innerHTML = `
    <div class="icon">
      <i class="fas fa-id-card"></i>
    </div>
    <span class="header">Drag & Drop</span>
    <span class="header">or <span class="button">Click here to browse</span></span>
    <input type="file" name="file" hidden />
    <span class="support">Supports: JPEG, JPG, PNG</span>
    <span class="note">Image of your ID card should be visible at 4 corners and make sure it is front side </span>
  `;
  
  // Re-attach event listeners to the new button
  const newButton = dropArea.querySelector('.button');
  const newInput = dropArea.querySelector('input');
  
  newButton.onclick = () => {
    newInput.click();
  };
  
  // Re-attach file input change listener
  newInput.addEventListener('change', function () {
    file = this.files[0];
    dropArea.classList.add('active');
    displayFile();
  });
  
  // Reset file variable
  file = null;
  
  // Clear the extracted data display
  document.querySelector('.person__img').innerHTML = '';
  document.querySelector('.info__id').innerHTML = 'Số (ID): ';
  document.querySelector('.info__name').innerHTML = 'Họ và tên (Full name): ';
  document.querySelector('.info__date').innerHTML = 'Ngày sinh (Date of birth): ';
  document.querySelector('.info__sex').innerHTML = 'Giới tính (Sex): ';
  document.querySelector('.info__nation').innerHTML = 'Quốc tịch (Nationality): ';
  document.querySelector('.info__hometown').innerHTML = 'Quê quán (Place of origin): ';
  document.querySelector('.info__address').innerHTML = 'Nơi thường trú (Place of residence): ';
  document.querySelector('.info__doe').innerHTML = 'Ngày hết hạn (Date of expiry): ';
}

// Initialize history when page loads
document.addEventListener('DOMContentLoaded', function() {
  initializeHistory();
  updateHistoryDisplay();
});
