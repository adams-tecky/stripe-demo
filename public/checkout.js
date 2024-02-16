window.onload = async () => {
    console.log("hi")

    let data = await getProducts()

    renderProducts(data)
}

async function getProducts() {

    let res = await fetch("/products")

    let result = await res.json()

    return result.data
}


function renderProducts(data) {
    let finalHtml = ""

    for (let entry of data) {
        finalHtml += `
        <div class="product">
    <img
      src=${entry.image}
      alt=${entry.name}
    />
    <div class="description">
      <h3>${entry.name}</h3>
      <h5>$ ${entry.price}</h5>
      <input type='number' value='0' class='quantity' id='${entry.id}'/> 
    </div>
    </div>
    <br/>
    `
    }

    document.querySelector("#products").innerHTML = finalHtml
}



async function handleCheckout() {

    console.log("now checkcout")

    let targets = document.querySelectorAll('.quantity')

    let orderTicket = []
    for (let entry of targets) {
        if (entry.value != 0) {
            orderTicket.push({ product_id: entry.id, quantity: entry.value })
        }
    }

    console.log(orderTicket)



    let result = await fetch("/create-checkout-session", {
        method: 'post',
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify(orderTicket)
    })


    if (result.ok) {
        console.log('Request sent successfully');

        // Fetch the session URL from the response
        const { url } = await result.json();

        // Redirect the user to the Stripe Checkout page
        window.location.href = url;
    } else {
        console.log('Request failed');
    }

}