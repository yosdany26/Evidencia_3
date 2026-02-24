// ============================================
// SISTEMA DE BIBLIOTECA - SOLUCIÓN INTEGRAL
// ============================================

// --- 1. CLASES DE LÓGICA (MODELO) ---
class LibraryItem {
  #id; #title; #available; #location;
  constructor(title, location) {
    this.#id = crypto.randomUUID().substring(0, 8);
    this.#title = title;
    this.#location = location;
    this.#available = true;
  }
  get id() { return this.#id; }
  get title() { return this.#title; }
  get isAvailable() { return this.#available; }
  get location() { return this.#location; }
  checkout() { this.#available = false; }
  checkin() { this.#available = true; }
  getType() { return this.constructor.name; }
}

class Book extends LibraryItem {}
class Magazine extends LibraryItem {}
class DVD extends LibraryItem {}
class AudioBook extends LibraryItem {}

class Member {
  #id; #name; #email; #type; #borrowedCount = 0;
  constructor(name, email, type) {
    this.#id = crypto.randomUUID().substring(0, 8);
    this.#name = name;
    this.#email = email;
    this.#type = type;
  }
  get id() { return this.#id; }
  get name() { return this.#name; }
  get email() { return this.#email; }
  get type() { return this.#type; }
  get borrowedCount() { return this.#borrowedCount; }
  
  incrementLoans() { this.#borrowedCount++; }
  decrementLoans() { if(this.#borrowedCount > 0) this.#borrowedCount--; }
}

class Library {
  #items = []; #members = []; #loans = [];

  addItem(item) { this.#items.push(item); }
  addMember(member) { this.#members.push(member); }
  
  get items() { return this.#items; }
  get members() { return this.#members; }
  get activeLoans() { return this.#loans.filter(l => !l.returned); }

  createLoan(itemId, memberId) {
    const item = this.#items.find(i => i.id === itemId);
    const member = this.#members.find(m => m.id === memberId);
    
    if (item && member && item.isAvailable) {
      item.checkout();
      member.incrementLoans();
      const loan = { id: crypto.randomUUID().substring(0, 5), item, member, date: new Date(), returned: false };
      this.#loans.push(loan);
      return true;
    }
    return false;
  }

  returnLoan(loanId) {
    const loan = this.#loans.find(l => l.id === loanId);
    if (loan) {
      loan.returned = true;
      loan.item.checkin();
      loan.member.decrementLoans();
      return true;
    }
    return false;
  }
}

// --- 2. CONTROLADOR DE INTERFAZ (UI) ---
class LibraryUI {
  #library;
  constructor(library) {
    this.#library = library;
    this.init();
  }

  init() {
    this.setupData();
    this.setupEventListeners();
    this.render();
  }

  setupData() {
    this.#library.addItem(new Book("Padre Rico Padre Pobre", "A-1"));
    this.#library.addItem(new Book("El Inversor Inteligente", "A-2"));
    this.#library.addItem(new Book("La psicología del dinero", "C-2"));

    this.#library.addMember(new Member("Usuario de Prueba", "test@mail.com", "standard"));
  }

  setupEventListeners() {
    // Gestión de Pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      };
    });

    // Gestión de Modales (Abrir/Cerrar)
    const modalMap = { 'add-member-btn': 'add-member-modal', 'add-item-btn': 'add-item-modal', 'new-loan-btn': 'new-loan-modal' };
    Object.entries(modalMap).forEach(([btnId, modalId]) => {
      const btn = document.getElementById(btnId);
      const modal = document.getElementById(modalId);
      if(btn) btn.onclick = () => modal.style.display = 'block';
      if(modal) {
        modal.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
        modal.querySelector('.cancel-btn').onclick = () => modal.style.display = 'none';
      }
    });

    // Formulario: Registrar Miembro
    document.getElementById('add-member-form').onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('member-name').value;
      const email = document.getElementById('member-email').value;
      const type = document.getElementById('membership-type').value;
      
      this.#library.addMember(new Member(name, email, type));
      e.target.reset();
      document.getElementById('add-member-modal').style.display = 'none';
      this.render();
    };

    // Formulario: Nuevo Préstamo
    document.getElementById('new-loan-form').onsubmit = (e) => {
      e.preventDefault();
      const itemId = document.getElementById('loan-item').value;
      const memberId = document.getElementById('loan-member').value;
      
      if(this.#library.createLoan(itemId, memberId)) {
        document.getElementById('new-loan-modal').style.display = 'none';
        this.render();
      } else {
        alert("No se pudo realizar el préstamo.");
      }
    };
  }

  render() {
    // Lista de Miembros
    const mList = document.getElementById('members-list');
    mList.innerHTML = this.#library.members.map(m => `
      <div class="stat-card">
        <h3>👤 ${m.name}</h3>
        <p>${m.email} | <strong>${m.type.toUpperCase()}</strong></p>
        <p>Libros: ${m.borrowedCount}</p>
      </div>
    `).join('');

    // Catálogo
    const cList = document.getElementById('catalog-list');
    cList.innerHTML = this.#library.items.map(i => `
      <div class="stat-card">
        <h3>📖 ${i.title}</h3>
        <p>Ubicación: ${i.location}</p>
        <span class="status ${i.isAvailable ? 'available' : 'borrowed'}">
          ${i.isAvailable ? 'Disponible' : 'Prestado'}
        </span>
      </div>
    `).join('');

    // Préstamos Activos
    const lList = document.getElementById('active-loans');
    lList.innerHTML = this.#library.activeLoans.map(l => `
      <div class="stat-card" style="border-left: 5px solid var(--accent-blue)">
        <p><strong>${l.item.title}</strong></p>
        <p>Miembro: ${l.member.name}</p>
        <button onclick="window.ui.handleReturn('${l.id}')" class="btn btn-warning" style="margin-top:10px">Devolver</button>
      </div>
    `).join('');

    // Actualizar Selectores de Formulario
    document.getElementById('loan-member').innerHTML = '<option value="">Seleccionar...</option>' + 
      this.#library.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    
    document.getElementById('loan-item').innerHTML = '<option value="">Seleccionar...</option>' + 
      this.#library.items.filter(i => i.isAvailable).map(i => `<option value="${i.id}">${i.title}</option>`).join('');

    // Estadísticas
    document.getElementById('total-items').innerText = this.#library.items.length;
    document.getElementById('total-members').innerText = this.#library.members.length;
    document.getElementById('active-loans-count').innerText = this.#library.activeLoans.length;
    document.getElementById('available-items').innerText = this.#library.items.filter(i => i.isAvailable).length;
  }

  handleReturn(loanId) {
    if(this.#library.returnLoan(loanId)) this.render();
  }
}

// ARRANQUE
const lib = new Library();
window.ui = new LibraryUI(lib);