$(document).ready(function() {
    //Set DateTime

    var date_now = moment().format('dddd, D MMM, YYYY');
    $("#date_now").html(date_now);

    var month_now = moment().format('MMMM YYYY');
    $("#month_now").html(month_now);
    $("#month_now_table").html(month_now);

    getProjectCodeByUser();
    getCustomerCRM();
    getProgrammer();
    getTicketStatusCount ();
    getTicket();

    $("#startDate").datepicker({
        format: 'dd/mm/yyyy',
        todayHighlight: true,
        autoclose: true,
        endDate: new Date(),
        forceParse: false
    });

    $("#startDate").on("change", function() {
        const dateStr = $(this).val();
        const parts = dateStr.split("/");
        const selectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
    
        if (isNaN(selectedDate.getTime())) return;

        $("#endDate").datepicker("setStartDate", selectedDate);
    
        const endDateStr = $("#endDate").val();
        if (endDateStr) {
            const endParts = endDateStr.split("/");
            const endDate = new Date(endParts[2], endParts[1] - 1, endParts[0]);
    
            if (selectedDate > endDate) {
                $("#endDate").datepicker("setDate", null);
            }
        }
        getProjectCodeByUser();
        getCustomerCRM();
        getTicketStatusCount ();
        getTicket();
    });
    

    $("#endDate").datepicker({
        format: 'dd/mm/yyyy',
        todayHighlight: true,
        autoclose: true,
        endDate: new Date(),
        forceParse: false
    })

    $("#endDate").on("change", function() {
        const endDateStr = $(this).val();
        const parts = endDateStr.split("/");
        const selectedEndDate = new Date(parts[2], parts[1] - 1, parts[0]);
    
        if (isNaN(selectedEndDate.getTime())) return;
    
        const startDateStr = $("#startDate").val();
        if (startDateStr) {
            const startParts = startDateStr.split("/");
            const selectedStartDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
    
            if (selectedStartDate > selectedEndDate) {
                $("#startDate").datepicker("setDate", null);
            }
        }
    
        $("#startDate").datepicker("setEndDate", selectedEndDate);
        getProjectCodeByUser();
        getCustomerCRM();
        getTicketStatusCount ();
        getTicket();
    });

    $("#operator").on("change", function () {
        getProjectCodeByUser();
        getCustomerCRM();
        getTicketStatusCount ();
        getTicket();
    });

    $("#project_code").on("change", function () {
        getCustomerCRM();
        getTicketStatusCount ();
        getTicket();
    });

    $("#customer_crm").on("change", function () {
        getProjectCodeByUser();
        getTicketStatusCount ();
        getTicket();
    });

    $("#project_type").on("change", function () {
        getProjectCodeByUser();
        getCustomerCRM();
        getTicketStatusCount ();
        getTicket();
    });


});



async function getProjectCodeByUser() {
    $("#project_code").select2({
        placeholder: '-- Select Project Code --',
        allowClear: true,
    });

    const customer_crm = $("#customer_crm").val() || "";
    const department_id = $("#department").val() || "";
    const operator_id = $("#operator").val() || "";
    const start_date = $("#startDate").val() || "";
    const end_date = $("#endDate").val() || "";
    const project_type = $("#project_type").val() || "";

    axios.post("/api/getProjectCode", {
            user_type : 'approver',
            department_id: department_id,
            operator_id: operator_id,
            start_date: start_date,
            end_date: end_date,
            customer_crm: customer_crm,
            project_type:project_type
        })
    .then((response) => setProjectCodeSelection(response.data.Result))
    .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

function setProjectCodeSelection(data) {
    const project_code_element = $("#project_code");
    const current_project_code_val = project_code_element.val();

    project_code_element.empty();
    project_code_element.append($('<option></option>').val("").text("All"));

    let found_current_project = false;
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const project_code = data[i];
            if (project_code && typeof project_code === 'string') {
                project_code_element.append($('<option></option>').val(project_code).text(project_code));
                if (String(project_code) === String(current_project_code_val)) {
                    found_current_project = true;
                }
            } else {
                console.warn('Malformed data entry for project code, skipping:', project_code);
            }
        }
    } else {
        console.warn('Data for setProjectCodeSelection is not an array:', data);
    }

    if (found_current_project) {
        project_code_element.val(current_project_code_val);
    } else {
        project_code_element.val("");
    }
}

async function getCustomerCRM() {
    $("#customer_crm").select2({
        placeholder: '-- Select Customer --',
        allowClear: true,
    });

    const project_code = $("#project_code").val() || "";
    const department_id = $("#department").val() || "";
    const operator_id = $("#operator").val() || "";
    const start_date = $("#startDate").val() || "";
    const end_date = $("#endDate").val() || "";
    const project_type = $("#project_type").val() || "";

    axios.post("/api/getCustomerCRM", {
        user_type : 'approver',
        department_id: department_id,
        operator_id: operator_id,
        start_date: start_date,
        end_date: end_date,
        project_code : project_code,
        project_type:project_type
    })
    .then((response) => setCustomerCRMSelection(response.data.Result))
    .catch((err) =>
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: err,
        })
    );
}

function setCustomerCRMSelection(data) {
    const customer_crm_element = $("#customer_crm");
    const current_customer_crm_val = customer_crm_element.val();

    customer_crm_element.empty();
    customer_crm_element.append($('<option></option>').val("").text("All"));

    let found_current_customer = false;
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (item && typeof item === 'object' && typeof item.code !== 'undefined' && typeof item.name !== 'undefined') {
                const project_crm_code = item.code;
                const customer_crm_name = item.name;
                customer_crm_element.append($('<option></option>').val(customer_crm_name).text(customer_crm_name));

                if (String(customer_crm_name) === String(current_customer_crm_val)) {
                    found_current_customer = true;
                }
            } else {
                console.warn('Malformed data entry for customer CRM, skipping:', item);
            }
        }
    } else {
        console.warn('Data for setCustomerCRMSelection is not an array:', data);
    }

    if (found_current_customer) {
        customer_crm_element.val(current_customer_crm_val);
    } else {
        customer_crm_element.val("");
    }
}


async function getProgrammer(department_id = "") {
    $("#operator").select2({
        placeholder: '-- Select Operator --',
        allowClear: true,
    });
    try {
        const response = await axios.post("/api/getProgramer", {
            department_id: department_id
        });
        setDevSelection(response.data.Result);
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: err,
        });
    }
}

function setDevSelection(data) {
    var ticket_programmer_selected = document.getElementById("operator");

    console.log(data);

    ticket_programmer_selected.innerHTML = "";
    var optAll = document.createElement("option");
    optAll.value = "";
    optAll.innerHTML = "All";
    optAll.selected = true;
    ticket_programmer_selected.appendChild(optAll);

    for (let i = 0; i < data.length; i++) {
        var user_id = data[i].user_id;
        var user_name = data[i].user_firstname + " " + data[i].user_lastname;
        var opt = document.createElement("option");
        opt.value = user_id;
        opt.innerHTML = user_name;
        ticket_programmer_selected.appendChild(opt);
    }
}

async function getTicketStatusCount() {

    const customer_crm = $("#customer_crm").val() || "";
    const department_id = $("#department").val() || "";
    const operator_id = $("#operator").val() || "";
    const start_date = $("#startDate").val() || "";
    const end_date = $("#endDate").val() || "";
    const project_type = $("#project_type").val() || "";
    const project_code = $("#project_code").val() || "";

    axios.post("/api/getTicketStatusCount", {
            user_type : 'approver',
            department_id: department_id,
            operator_id: operator_id,
            start_date: start_date,
            end_date: end_date,
            customer_crm: customer_crm,
            project_type:project_type,
            project_code:project_code
        })
    .then((response) => setTicketStatusCount(response.data.Result))
    .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

function setTicketStatusCount(data) {
    $("#total_complete").html(data.count_complete_tickets + data.count_on_time_tickets);
    $("#total_delay").html(data.count_delay_tickets);
}

var chart_ticket;

function getTicket(status_id) {

    $("#TicketChart").hide();

    var user_type = 'approver';
    const operator_id = $("#operator").val();
    const start_date = $("#startDate").val();
    const end_date = $("#endDate").val();
    const project_code = $("#project_code").val();
    const customer_crm = $("#customer_crm").val();
    const project_type = $("#project_type").val() || "";

    axios.post("/api/getTicketTotal", {
        user_type: user_type,
        operator_id: operator_id,
        start_date: start_date,
        end_date: end_date,
        project_code:project_code,
        customer_crm:customer_crm,
        project_type:project_type
    })
    .then(response => setTotalTicket(user_type, response.data, status_id))
        .catch(err => Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: err
        }))

}

function setTotalTicket(user_type, data, status_id) {

    if (data.Result[0] > 0) {
        $("#TicketChart").show();
    }

    $("#total_monthly_ticket_manager").html(data.Result[0]);
    $("#total_waiting_manager_approve").html(data.Result[1]);
    $("#total_waiting_dev_approve").html(data.Result[2]);
    $("#total_in_process_manager").html(data.Result[3]);
    $("#total_pj_complete_wait_manager_approve").html(data.Result[4]);
    $("#total_disapprove_dev_manager").html(data.Result[5]);
    $("#total_approve_dev_manager").html(data.Result[6]);
    $("#total_disapprove_user_manager").html(data.Result[7]);
    $("#total_cancel_manager").html(data.Result[8]);
    $("#total_reject").html(data.Result[9]);
    $("#total_waiting_user_approve").html(data.Result[10]);
    $("#total_user_reject").html(data.Result[11]);

    getDataChart(user_type, data, status_id);
    getDataTable(status_id, user_type);
}

function getDataChart(user_type, data, status_id) {

    const operator_id = $("#operator").val();
    const start_date = $("#startDate").val();
    const end_date = $("#endDate").val();
    const project_code = $("#project_code").val();
    const customer_crm = $("#customer_crm").val();
    const project_type = $("#project_type").val() || "";

    axios.post("/api/getDataChart", {
        status_id: status_id,
        user_type: user_type,
        operator_id: operator_id,
        start_date: start_date,
        end_date: end_date,
        project_code:project_code,
        customer_crm:customer_crm,
        project_type:project_type
    })
    .then(response => setDataChart(user_type, response.data, status_id))
        .catch(err => Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: err
        }))

}

function setDataChart(user_type, data) {

    //Chart

    const ChartArea = document.getElementById('ChartArea');
    const TicketChart = document.getElementById('TicketChart');

    if (!ChartArea || !TicketChart) return;
    var data_labels = [
        '', ['Waiting Approver \n', 'approve : ' + data.Result[1]],
        ['Waiting ', 'Operator \n', 'confirm : ' + data.Result[2]],
        'In Process : ' + data.Result[3],
        ['Project complete, \n', 'waiting approve : ' + data.Result[4]],
        ['Disapprove \n', '(Operator) : ' + data.Result[5]],
        ['Approve \n', '(Operator) : ' + data.Result[6]],
        ['Dispprove \n', '(User) : ' + data.Result[7]],
        'User Cancel : ' + data.Result[8],
        'Reject : ' + data.Result[9],
        'Waiting User Approve : ' + data.Result[10],
        'User Reject : ' + data.Result[11],
    ];
    var data_backgroundColor = [
        '',
        '#C433FF',
        '#F7BA5E',
        '#61D9FF',
        '#7F5A58',
        '#FB95FB',
        '#0FCA7A',
        '#F75D5F',
        '#808080',
        '#ff6f00',
        '#DFD187',
        '#B89169',
    ];
    var data_array = [];
    var label_array = [];
    var bg_array = [];

    for (let i = 1; i < data.Result.length; i++) {
        if (data.Result[i]) {
            data_array.push(data.Result[i]);
            label_array.push(data_labels[i]);
            bg_array.push(data_backgroundColor[i]);
        }
    }

    const isEmpty = data_array.length === 0;

    if (isEmpty) {
        ChartArea.classList.add('d-none');
        if (chart_ticket) {
            chart_ticket.destroy();
            chart_ticket = null;
        }
        return;
    } else {
        ChartArea.classList.remove('d-none');
    }
    

    if (chart_ticket) {
        chart_ticket.destroy();
        chart_ticket = null;
    }

    chart_ticket = new Chart(TicketChart, {
        type: 'pie',
        data: {
            labels: label_array,
            datasets: [{
                data: data_array,
                backgroundColor: bg_array,
                hoverOffset: 4
            }],
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                }
            }
        }
    });
}

function getDataTable(status_id, user_type) {
    const operator_id = $("#operator").val();
    const start_date = $("#startDate").val();
    const end_date = $("#endDate").val();
    const project_code = $("#project_code").val();
    const customer_crm = $("#customer_crm").val();
    const project_type = $("#project_type").val() || "";

    axios.post("/api/getDataTable", {
        status_id: status_id,
        user_type: user_type,
        operator_id: operator_id,
        start_date: start_date,
        end_date: end_date,
        project_code: project_code,
        customer_crm:customer_crm,
        project_type:project_type
      })
    .then(response => setDataTable(response.data))
        .catch(err => Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: err
        }))

}

function setDataTable(data) {
    var item_dataTable = [];
    var user_type = $("#user_type").val();

    for (let i = 0; i < data.Result.length; i++) {

        const ticket_id = data.Result[i].ticket_id;
        var ticket_no = data.Result[i].ticket_no
        var ticket_name = data.Result[i].ticket_name;
        const department_id = data.Result[i].department_id;
        var datetime = data.Result[i].ticket_datetime;
        //console.log(datetime);
        var ticket_datetime = moment(datetime).format("YYYY-MM-DD HH:mm:ss");
        var ticket_project = data.Result[i].ticket_project_code;
        var user_name = data.Result[i].ticket_user;
        var user_department = data.Result[i].department_name;
        var programmer_name = data.Result[i].ticket_programmer;
        if (!programmer_name) {
            programmer_name = "-"
        }
        var due_date_user = data.Result[i].ticket_due_date_user;
        var ticket_due_date_user = moment(due_date_user).format("YYYY-MM-DD");
        var due_date_manager = data.Result[i].ticket_due_date_manager;
        if (due_date_manager) {
            var ticket_due_date_manager = moment(due_date_manager).format("YYYY-MM-DD");
        } else {
            var ticket_due_date_manager = "-";
        }

        var start_date = data.Result[i].ticket_start_date;
        if (start_date) {
            var ticket_start_date = moment(start_date).format("YYYY-MM-DD");
        } else {
            var ticket_start_date = "-";
        }

        var complete_date = data.Result[i].ticket_completion_date;
        if (complete_date) {
            var completion_date = moment(complete_date).format("YYYY-MM-DD");
        } else {
            var completion_date = "-";
        }

        var end_date = data.Result[i].ticket_end_date;
        if (end_date) {
            var ticket_end_date = moment(end_date).format("YYYY-MM-DD");
        } else {
            var ticket_end_date = "-";
        }
        var ticket_rating = data.Result[i].ticket_rating;
        if (!ticket_rating) {
            ticket_rating = "-"
        }
        var ticket_progress = data.Result[i].ticket_progress;
        var progress = '';
        if (!ticket_progress) {
            progress = "0 %"
        } else {
            progress = ticket_progress + " %"
        }
        var status_id = data.Result[i].status_id;
        var ticket_completion_date = data.Result[i].ticket_completion_date?moment(data.Result[i].ticket_completion_date).format("YYYY-MM-DD"):null;
        var status_complete = '';
        var today = moment().format("YYYY-MM-DD");

        var crm_customer_name = data.Result[i].crm_customer_name;
        if (!crm_customer_name) {
            crm_customer_name = "-"
        }

        var status_text= '';

        if (status_id == 8) {
            status_text = "complete"
            status_complete = "<span class='badge text-white' style='border-radius:10px; background-color:#0FCA7A;'>Complete</span>";
        } else if (ticket_due_date_manager === "-") {
            status_text = "ontime"
            status_complete = "<span class='badge text-white' style='border-radius:10px; background-color:#61D9FF;'>On Time</span>";
        } else if (ticket_completion_date) {
            if (ticket_completion_date <= ticket_due_date_manager) {
                status_text = "complete"
                status_complete = "<span class='badge text-white' style='border-radius:10px; background-color:#0FCA7A;'>Complete</span>";
            } else {
                status_text = "delay"
                status_complete = "<span class='badge text-white' style='border-radius:10px; background-color:#F75D5F;'>Delay</span>";
            }
        } else {
            if (today <= ticket_due_date_manager) {
                status_text = "ontime"
                status_complete = "<span class='badge text-white' style='border-radius:10px; background-color:#61D9FF;'>On Time</span>";
            } else {
                status_text = "delay"
                status_complete = "<span class='badge text-white' style='border-radius:10px; background-color:#F75D5F;'>Delay</span>";
            }
        }
        
        const currentDate = new Date();
        console.log(i,ticket_completion_date,ticket_due_date_manager,currentDate,status_text)

      

        var user_name_data = $("#user_name_data").val();
        if (status_id == 1) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #C433FF;'>Waiting Approver approve</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>";
            if (user_name == user_name_data) {
                action += "<div class='col-3'>" +
                    "<span class='badge text-white' onclick='deleteTicket(" + ticket_id + "); return false' style='border-radius: 10px; background-color: #F75D5F; cursor:pointer;'><img class='card-icon' src='../public/images/icon/bin.png' /></span>" +
                    "</div>";
            }
            action += "</div>";
        } else if (status_id == 2) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #F7BA5E;'>Waiting Operator confirm</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>";
            if (user_name == user_name_data) {
                action += "<div class='col-3'>" +
                    "<span class='badge text-white' onclick='cancelTicket(" + ticket_id, department_id + "); return false' style='border-radius: 10px; background-color: #808080; cursor:pointer;'><img class='card-icon' src='../public/images/icon/x.png' /></span>" +
                    "</div>";
            }
            action += "</div>";
        } else if (status_id == 3) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #61D9FF;'>In Process</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>";
            if (user_name == user_name_data) {
                action += "<div class='col-3'>" +
                    "<span class='badge text-white' onclick='cancelTicket(" + ticket_id, department_id + "); return false' style='border-radius: 10px; background-color: #808080; cursor:pointer;'><img class='card-icon' src='../public/images/icon/x.png' /></span>" +
                    "</div>";
            }
            action += "</div>";
        } else if (status_id == 4) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #7F5A58;'>Project complete, waiting approver approve</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>";
            if (user_name == user_name_data) {
                action += "<div class='col-3'>" +
                    "<span class='badge text-white' onclick='cancelTicket(" + ticket_id, department_id + "); return false' style='border-radius: 10px; background-color: #808080; cursor:pointer;'><img class='card-icon' src='../public/images/icon/x.png' /></span>" +
                    "</div>";
            }
            action += "</div>";
        } else if (status_id == 5) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #FB95FB;'>Disapprove project (Operator)</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>";
            if (user_name == user_name_data) {
                action += "<div class='col-3'>" +
                    "<span class='badge text-white' onclick='cancelTicket(" + ticket_id, department_id + "); return false' style='border-radius: 10px; background-color: #808080; cursor:pointer;'><img class='card-icon' src='../public/images/icon/x.png' /></span>" +
                    "</div>";
            }
            action += "</div>";
        } else if (status_id == 6) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #0FCA7A;'>Success</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>" +
                "</div>";
        } else if (status_id == 7) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #F75D5F;'>Dispprove (User)</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>" +
                "</div>";
        } else if (status_id == 8) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #808080;'>Cancel</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>" +
                "</div>";
        } else if (status_id == 9) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #ff6f00;'>Reject</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>" +
                "</div>";
        } else if (status_id == 10) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #DFD187;'>Waiting user approve</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>" +
                "</div>";
        } else if (status_id == 11) {
            var status = "<span class='badge text-white' style='border-radius: 10px; background-color: #B89169;'>User Reject</span>";
            var action = "<div class='row text-center'>" +
                "<div class='col-4'>" +
                "<a href='/ticketDetailApprover?ticket_id=" + ticket_id + "'><span class='badge text-white' style='border-radius: 10px; background-color: #7B61FF;'><img class='card-icon' src='../public/images/icon/google-docs.png' /></span></a>" +
                "</div>" +
                "</div>";
        }


        var all_item = {
            "Action": action,
            "#": ticket_id,
            "Ticket No": ticket_no,
            "Ticket Name": ticket_name,
            "Ticket Status": status,
            "Progress Status" : status_complete,
            "Progress": progress,
            "Ticket Due Date": ticket_due_date_manager,
            "Ticket Date": ticket_datetime,
            "Project Code": ticket_project,
            "Customer Name": crm_customer_name,
            "User Name": user_name,
            "User Department": user_department,
            "Operator Name": programmer_name,
            "Ticket Estimate Date": ticket_due_date_user,
            "Ticket Start Date": ticket_start_date,
            "Ticket Completion Date": completion_date,
            "Ticket End Date": ticket_end_date,
            "Average Rating": ticket_rating
        }
        item_dataTable.push(all_item);
    }


    $("#tableTickets").DataTable({
        destroy: true,
        data: item_dataTable,
        paging: true,
        pageLength: 5,
        scrollX: true,
        lengthMenu: [
            [5, 10, 20, -1],
            [5, 10, 20, 'All']
        ],
        "columns": [
            { "data": "Action", width: '80px' },
            {
                data: null,
                render: (data, type, row, meta) => meta.row + 1
            },
            { "data": "Ticket No" },
            { "data": "Ticket Name", width: '150px' },
            { "data": "Ticket Status", width: '100px' },
            { "data": "Progress Status", width: '50px' },
            { "data": "Progress", width: '50px' },
            { "data": "Ticket Due Date", width: '100px' },
            { "data": "Ticket Date", width: '100px' },
            { "data": "Project Code", width: '150px' },
            { "data": "Customer Name", width: '150px' },
            { "data": "User Name", width: '150px' },
            { "data": "User Department", width: '150px' },
            { "data": "Operator Name", width: '150px' },
            { "data": "Ticket Estimate Date", width: '150px' },
            { "data": "Ticket Start Date", width: '100px' },
            { "data": "Ticket Completion Date", width: '150px' },
            { "data": "Ticket End Date", width: '100px' },
            { "data": "Average Rating" },
        ]
    });
}

function cancelTicket(ticket_id, department_id) {
    //console.log(ticket_id);
    var status_id = 8;
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#04AA6D',
        cancelButtonColor: '#d9534f',
        confirmButtonText: 'Yes, cancel ticket!'
    }).then((result) => {
        if (result.isConfirmed) {
            axios.post("/api/updateCancelTicket", {
                ticket_id: ticket_id,
                status_id: status_id,
                department_id: department_id

            })

            .then(response => addSuccess())
                .catch(err => Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: err
                }))
        }
    });

}

function lineNotify(ticket_no, ticket_name, status_id, user_firstname, user_lastname, user_email, dev_name) {

    axios.post("/api/LineNotify", {
            status_id: status_id,
            ticket_no: ticket_no,
            user_first_name: user_firstname,
            user_last_name: user_lastname,
            user_email: user_email,
            ticket_name: ticket_name,
            dev_name: dev_name,
            update_dev: '',
            ticket_rating: ''
        })
        .then(response => addSuccess())
        .catch(err => Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: err
        }))
}

function deleteTicket(ticket_id) {
    //console.log(ticket_id);
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#04AA6D',
        cancelButtonColor: '#d9534f',
        confirmButtonText: 'Yes, delete ticket!'
    }).then((result) => {
        if (result.isConfirmed) {
            axios.post("/api/deleteTicket", {
                ticket_id: ticket_id

            })

            .then(response => deleteSuccess())
                .catch(err => Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: err
                }))
        }
    });

}

function addSuccess() {

    Swal.fire({
        title: 'Success!',
        text: "Your ticket has been updated.",
        icon: 'success',
        didOpen: () => {
            Swal
        }
    })
    setTimeout(function() {
        Swal.close();
        location.reload();
    }, 1000);
}

function deleteSuccess() {

    Swal.fire({
        title: 'Success!',
        text: "Your ticket has been deleted.",
        icon: 'success',
        didOpen: () => {
            Swal
        }
    })

    setTimeout(function() {
        Swal.close();
        window.location.href = '/dashboardApprover';
        // location.reload();
    }, 1000);

}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function() {
        //console.log('User signed out.');
    });
}