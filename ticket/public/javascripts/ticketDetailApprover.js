$(document).ready(async function() {
    let ticket_level_id = 0;
    checkDueDate();
    getDepartment();
    await getTicketDetail();
    getCategory();
    clearSign();
    addTicketApprove();
    addTicketConfirm();
    addTicketApproveConfirm();
    addTicketChangeDuedate();
    addTicketChangedevConfirm();
    addTicketAcceptUserReject();
    addTicketComplete();
    addTicketApprove2();
    addTicketSuccess();
    reviseTicket();
    addRatingUser();
    changeSign();
    changeTicketCode();
    $(".loader").hide();
    addRowTask();
});

function changeDueDateApprover() {
    var status = parseInt($("#status_ticket").val());
    $("#custom_due_date").on("change", function() {
        var is_checked = $(this).is(":checked");

        if (is_checked) {
            $("#ticket_due_date_manager").removeAttr("disabled");
            $("#ticket_due_date_manager").removeAttr("readonly");
            $("#ticket_due_date_manager").css({
                "background-color": "transparent",
            });
            var dateToday = new Date();
            $("#ticket_due_date_manager").datepicker({
                format: "yyyy-mm-dd",
                todayHighlight: "TRUE",
                autoclose: true,
                showButtonPanel: true,
                minDate: dateToday,
                startDate: dateToday,
            });
            $("#note_duedate").show();
            if (status == 3 || status == 2) {
                $("#btn_change_duedate").show();
            }
        } else {
            $("#ticket_due_date_manager").prop("disabled", true);
            $("#note_duedate").hide();
            $("#ticket_due_date_manager").css({
                "background-color": "#e9ecef",
            });

            if (status == 3 || status == 2) {
                $("#btn_change_duedate").hide();
            }
        }
    });
    console.log(status);
    $("#duedate_remark").on("change", function() {
        if (![1, 6, 7, 8].includes(status)) {
            $("#btn_change_duedate").show();
        }
    });
}

var devDB = [];
var ticket_sign_programmer_img = "";

function addRowTask() {
    $("#button_add_task").click(function(event) {
        const container = document.getElementById("input-container");
        const newInput = document.createElement("div");
        const index = container.children.length + 1;
        newInput.classList.add("input-group", "mb-1");
        newInput.innerHTML = `
              <span class="input-group-text input-index">${index}</span>
              <input type="text" class="form-control" name="input[]" placeholder="">
              <button type="button" class="btn btn-danger btn-sm" id="button_delete_task" onclick="removeRowTaskActivity(this,'insert')"><img class='card-icon' src='../public/images/icon/bin.png' /></button>
          `;
        container.appendChild(newInput);
    });

    $("#button_add_task_detail").click(function(event) {
        const container = document.getElementById("input-container-detail");
        const newInput = document.createElement("div");
        const index = container.children.length + 1;
        newInput.classList.add("input-group", "mb-1");
        newInput.innerHTML = `
              <span class="input-group-text input-index">${index}</span>
              <input type="text" class="form-control" name="input[]" placeholder="">
              <button type="button" class="btn btn-danger btn-sm" id="button_delete_task_detail" onclick="removeRowTaskActivity(this,'insert-detail')"><img class='card-icon' src='../public/images/icon/bin.png' /></button>
          `;
        container.appendChild(newInput);
    });
}

function removeRowTaskActivity(data, type) {
    data.parentElement.remove();
    updateIndexes(type);
}

function calculateProgress(status_id) {
    const inputs = document.querySelectorAll('input[name="input-detail[]"]');
    const task_activitys = Array.from(inputs).map((input) => input);

    const checkboxes = document.querySelectorAll('input[name="checkbox[]"]');
    const inputChecked = Array.from(checkboxes).map(
        (checkbox) => checkbox.checked
    );

    let totalSuccess = 0;
    let totalProgress = inputChecked.length;
    let colorProgress = "black";

    task_activitys
        .filter((e, idx) => inputChecked[idx])
        .forEach((e) => (totalSuccess += 1));
    let progress = (totalSuccess / totalProgress) * 100;
    var user_type = $("#user_type").val();

    // $("#selected_approve_star_manager").hide();

    if (parseInt(progress) == 100) {
        colorProgress = "green";
        console.log(user_type, ticket_level_id);
        if (
            (user_type == 3 || user_type == 4) &&
            status_id != 5 &&
            status_id != 8 &&
            status_id != 11
        ) {
            if (user_type == 3 || (user_type == 4 && ticket_level_id == 2)) {
                if (status_id == 4 || status_id == 3) {
                    $("#selected_approve_star_manager").hide();
                } else {
                    $("#selected_approve_star_manager").show();
                }
            } else {
                $("#selected_approve2").hide();
                $("#btn_approve_ticket2").hide();
            }
        }
    } else if (parseInt(progress) > 0) {
        colorProgress = "orange";
    }
    if (isNaN(progress)) progress = 0;

    $("#label_task_activity").html(
        "Task Activity <span style='font-size: 18px;color: " +
        colorProgress +
        "'>(" +
        progress.toFixed(2) +
        "%)</span>"
    );
    return parseInt(progress);
}

function updateIndexes(type) {
    if (type == "insert") {
        const rows = document.querySelectorAll("#input-container .input-group");
        rows.forEach((row, index) => {
            row.querySelector(".input-index").textContent = `${index + 1}`;
        });
    } else {
        const rows = document.querySelectorAll(
            "#input-container-detail .input-group"
        );
        rows.forEach((row, index) => {
            row.querySelector(".input-index").textContent = `${index + 1}`;
        });
    }
}

async function getProjectCode() {
    $("#ticket_project_name").select2({
        placeholder: "Please select project code",
        allowClear: true,
    });
    try {
        const response = await axios.get("/api/getProjectCRM", {});
        setProjectCode(response.data.Result);
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: err,
        });
    }
}

function setProjectCode(data) {
    var ticket_project_name = document.getElementById("ticket_project_name");
    for (let i = 0; i < data.length; i++) {
        var code = data[i].code;
        var name = data[i].name;
        var opt = document.createElement("option");
        opt.value = code + " | " + name;
        opt.innerHTML = "[" + data[i].code + "] " + data[i].name;
        ticket_project_name.appendChild(opt);
    }
}

function changeTicketCode() {
    $("#ticket_project_name_other_checkbox").on("change", function() {
        var is_checked = $(this).is(":checked");
        if (is_checked) {
            $("#ticket_project_name").prop("disabled", true);
            $("#ticket_project_name_other_form").show();
        } else {
            $("#ticket_project_name").prop("disabled", false);
            $("#ticket_project_name_other_form").hide();
        }
    });
}

async function getProgrammer(department_id, ticket_dev, dataDetail) {
    $("#ticket_programmer_selected").select2({
        placeholder: "Please select operator",
        allowClear: true,
    });

    axios
        .post("/api/getProgramer", { department_id: department_id })

    .then((response) =>
            setDevSelection(response.data.Result, ticket_dev, dataDetail,department_id)
        )
        .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

function setDevSelection(data, ticket_dev, dataDetail,department_id) {
    
    var ticket_programmer_selected = document.getElementById(
        "ticket_programmer_selected"
    );
    ticket_programmer_selected.innerHTML = "";
    
    console.log(data)

    for (let i = 0; i < data.length; i++) {
        const user_id = data[i].user_id;
        const user_name = data[i].user_firstname + " " + data[i].user_lastname;
        const status = data[i].status;
        const user_department_id = data[i].department_id;

        const opt = document.createElement("option");
        opt.value = user_id;
        opt.innerHTML = user_name;

        if (user_department_id == department_id) {
            if (status == 1) {
                ticket_programmer_selected.appendChild(opt);
            } else if (status == 0) {
                opt.disabled = true;
                opt.hidden = true;
                ticket_programmer_selected.appendChild(opt);
            }
        }
        
    }



    if (
        dataDetail.status_id != 1 ||
        dataDetail.status_id != 7 ||
        dataDetail.status_id != 9
    ) {
        $("#ticket_programmer_selected").val(ticket_dev).change();
        var programmer = $("#ticket_programmer_selected").select2("data");
        console.log(programmer);
        var manager_name =
            dataDetail.manager_firstname + " " + dataDetail.manager_lastname;

        for (let i = 0; i < programmer.length; i++) {
            console.log(programmer[i].text, manager_name);
            if (programmer[i].text == manager_name) {
                $("#programmer_name").html(manager_name);
                // $('#programmer_signature').show();
                // $('#clearSignProgrammer').show();
                // $('#file_programmer_signature').show();
                // $("#programmer_signature").jSignature();
                // $("#ticket_sign_programmer").hide();
                if (
                    dataDetail.status_id != 6 &&
                    dataDetail.status_id != 4 &&
                    dataDetail.status_id != 10 &&
                    dataDetail.status_id != 11
                ) {
                    $("#btn_edit_dev").hide();
                    $("#btn_changedev_confirm").show();
                }
            }
        }

        if (dataDetail.status_id == 2) {
            $("#ticket_programmer_selected").on("change", function() {
                $("#btn_edit_dev").show();
                $("#btn_changedev_confirm").hide();
                var programmer_change = $("#ticket_programmer_selected").select2(
                    "data"
                );
                console.log(programmer_change);
                $("#programmer_name").html("");
                $("#programmer_signature").hide();
                $("#clearSignProgrammer").hide();
                $("#file_programmer_signature").hide();
                $("#ticket_sign_programmer").show();
                if (data.ticket_signature_dev) {
                    ticket_sign_programmer_img = data.ticket_signature_dev;
                    $("#ticket_sign_programmer").attr("src", data.ticket_signature_dev);
                } else {
                    $("#ticket_sign_programmer").attr(
                        "src",
                        "../public/images/sign/sign_null.png"
                    );
                }
                $("#programmer_signature").empty();
                for (let i = 0; i < programmer_change.length; i++) {
                    console.log(programmer_change[i].text, manager_name);
                    if (programmer_change[i].text == manager_name) {
                        $("#programmer_name").html(manager_name);
                        $("#programmer_signature").show();
                        $("#clearSignProgrammer").show();
                        $("#file_programmer_signature").show();
                        $("#programmer_signature").jSignature();
                        $("#ticket_sign_programmer").hide();
                        $("#btn_edit_dev").hide();
                        $("#btn_changedev_confirm").show();
                    }
                }
            });
        } else if (dataDetail.status_id == 3) {
            $("#btn_edit_dev").hide();
            $("#btn_changedev_confirm").hide();
            $("#ticket_programmer_selected").on("change", function() {
                $("#btn_edit_dev").show();
                $("#btn_success").hide();
                $("#btn_changedev_confirm").hide();
                var rating_score = $(".scoreNow").html("0");
                $("#selected_approve_star_manager").hide();
                var programmer_change = $("#ticket_programmer_selected").select2(
                    "data"
                );
                $("#programmer_name").html("");
                $("#programmer_signature").hide();
                $("#clearSignProgrammer").hide();
                $("#file_programmer_signature").hide();
                $("#ticket_sign_programmer").show();
                $("#ticket_sign_programmer").attr(
                    "src",
                    "../public/images/sign/sign_null.png"
                );
                $("#programmer_signature").empty();

                for (let i = 0; i < programmer_change.length; i++) {
                    console.log(programmer_change[i].text, manager_name);
                    if (programmer_change[i].text == manager_name) {
                        $("#programmer_name").html(manager_name);
                        $("#programmer_signature").show();
                        $("#clearSignProgrammer").show();
                        $("#file_programmer_signature").show();
                        $("#programmer_signature").jSignature();
                        $("#ticket_sign_programmer").hide();
                        $("#btn_changedev_confirm").show();
                        $("#btn_edit_dev").hide();
                        $("#btn_success").hide();
                    }
                }

                let isNewDev = false;
                for (const devId of devDB) {
                    const old_dev = programmer_change.find((item) => item.id === devId);
                    if (!old_dev) {
                        isNewDev = true;
                        break;
                    }
                }
                if (devDB.length != programmer_change.length) {
                    isNewDev = true;
                }
                if (isNewDev) {
                    const haveApprover = programmer_change.find(
                        (item) => item.text === manager_name
                    );
                    if (!haveApprover) {
                        $("#btn_changedev_confirm").hide();
                    } else {
                        $("#btn_changedev_confirm").show();
                    }
                } else {
                    $("#btn_changedev_confirm").hide();
                    $("#programmer_signature").hide();
                    $("#clearSignProgrammer").hide();
                    $("#file_programmer_signature").hide();
                    $("#programmer_signature").jSignature();
                    $("#ticket_sign_programmer").show();
                    $("#ticket_sign_programmer").attr("src", ticket_sign_programmer_img);
                }
            });
        }
    }
}

function getDepartment() {
    $("#ticket_department_selected").select2({
        placeholder: "Please select department",
        allowClear: true,
    });

    axios
        .get("/api/getDepartment", {})

    .then((response) => setDeptSelection(response.data.Result))
        .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

function setDeptSelection(data) {
    // console.log(data)

    var ticket_department_selected = document.getElementById(
        "ticket_department_selected"
    );
    for (let i = 0; i < data.length; i++) {
        //console.log(data)
        var department_id = data[i].department_id;
        var department_name = data[i].department_name;
        var opt = document.createElement("option");
        opt.value = department_id;
        opt.innerHTML = department_name;
        ticket_department_selected.appendChild(opt);
    }
}

async function getTicketType(data) {
    $("#ticket_type_selected").select2({
        placeholder: "Please select type",
        allowClear: true,
    });

    axios
        .post("/api/getTicketType", { department_id: data.department_id })

    .then((response) => setTypeSelection(response.data.Result, data))
        .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

function setTypeSelection(response, data) {
    // console.log(data)

    var ticket_type_selected = document.getElementById("ticket_type_selected");
    for (let i = 0; i < response.length; i++) {
        //console.log(data)
        var ticket_type_id = response[i].ticket_type_id;
        var ticket_type_name = response[i].ticket_type_name;
        var opt = document.createElement("option");
        opt.value = ticket_type_id;
        opt.innerHTML = ticket_type_name;
        ticket_type_selected.appendChild(opt);
    }

    if (data.ticket_type_id) {
        $("#ticket_type_selected").val(data.ticket_type_id).change();
    }

    // $('#ticket_type_selected').val().change();
}

function getCategory() {
    $("#ticket_category_selected").select2({
        placeholder: "Please select category",
        allowClear: true,
    });

    axios
        .get("/api/getCategory", {})

    .then((response) => setCategorySelection(response.data.Result))
        .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

function setCategorySelection(data) {
    // console.log(data)

    var ticket_category_selected = document.getElementById(
        "ticket_category_selected"
    );
    for (let i = 0; i < data.length; i++) {
        //console.log(data)
        var category_id = data[i].category_id;
        var category_name = data[i].category_name;
        var opt = document.createElement("option");
        opt.value = category_id;
        opt.innerHTML = category_name;
        ticket_category_selected.appendChild(opt);
    }

    // $('#ticket_category_selected').val().change();
}

async function getSeverity(ticket) {
    $("#severity_detail").select2({
        placeholder: "Please select severity",
        allowClear: true,
    });
    axios
        .get("/api/getSeverity", {})

    .then((response) => setSeverity(response.data.Result, ticket))
        .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

function checkDueDate() {
    $("#severity_detail").on("change", function() {
        setDueDate();
    });
    $("#ticket_start_date").on("change", function() {
        setDueDate();
    });
}

function setDueDate() {
    var startDate = $("#ticket_start_date").val();
    console.log("severity=>", $("#severity_detail").val());
    if (startDate != "") {
        var date = new Date(startDate);
        var severity = $("#severity_detail").val();
        var severityDay = 0;
        var dateString = "";

        if (severity == "3") {
            severityDay += 1;
        } else if (severity == "4") {
            severityDay += 3;
        }
        date.setDate(date.getDate() + severityDay);
        if (severity == "5") {
            $("#custom_duedate").hide();
            $("#ticket_due_date_manager").prop("disabled", false);
            $("#ticket_due_date_manager").prop("readonly", true);
            $("#ticket_due_date_manager").css({
                "background-color": "white",
                color: "black",
            });
        } else {
            dateString = date.toISOString().split("T")[0];
            if (severity != "") {
                $("#custom_duedate").show();
                if ($("#custom_due_date").is(":checked")) {
                    console.log("Checkbox is  checked");
                    $("#ticket_due_date_manager").prop("disabled", false);
                    $("#ticket_due_date_manager").prop("readonly", true);
                    $("#ticket_due_date_manager").css({
                        "background-color": "white",
                        color: "black",
                    });
                } else {
                    console.log("Checkbox is not checked");
                    $("#ticket_due_date_manager").prop("disabled", true);
                    $("#ticket_due_date_manager").prop("readonly", true);
                    $("#ticket_due_date_manager").css({
                        "background-color": "#e9ecef",
                        color: "black",
                    });
                }
            }
        }
        $("#ticket_due_date_manager").val(dateString);
    }
}

function setSeverity(data, ticket) {
    var severity_detail = document.getElementById("severity_detail");
    for (let i = 0; i < data.length; i++) {
        var id = data[i].severity_id;
        var name = data[i].severity_name;
        var desc = data[i].severity_description;
        var opt = document.createElement("option");
        opt.value = id;
        if (data[i].severity_id === 5 && ticket.department_id === 1) {
            name = "Normal";
            desc = "";
        }
        opt.innerHTML = name + " " + desc;
        severity_detail.appendChild(opt);

        console.log('severity_id=>  ', ticket.severity_id);

        if (ticket.status_id > 1) {
            $("#severity_detail").val(ticket.severity_id);
            $("#severity_detail").prop("disabled", true);
        }

        if (ticket.department_id != 3) {
            $("#severity_detail").val(5);
            $("#severity_detail").prop("disabled", true);
            $("#ticket_due_date_manager").prop("disabled", false);
            $("#ticket_due_date_manager").prop("readonly", true);
        }

        if (ticket.status_id == 7 || ticket.status_id == 9) {
            $("#severity_detail").val(null);
            $("#severity_detail").prop("disabled", true);
        }
    }
}

async function getLevel(ticket) {
    $("#level_detail").select2({
        placeholder: "Please select level",
        allowClear: true,
    });

    axios
        .get("/api/getLevel", {})

    .then((response) => setLevelSelection(response.data.Result, ticket))
        .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

function setLevelSelection(data, ticket) {
    var level_detail = document.getElementById("level_detail");
    for (let i = 0; i < data.length; i++) {
        var id = data[i].ticket_level_id;
        var name = data[i].ticket_level_name;
        var opt = document.createElement("option");
        opt.value = id;
        opt.innerHTML = name;
        level_detail.appendChild(opt);

        if (ticket.status_id > 1) {
            $("#level_detail").val(ticket.ticket_level_id);
            $("#level_detail").prop("disabled", true);
        }
    }
}

async function getTicketDetail() {
    await getProjectCode();
    var ticket_id = getUrlParameter("ticket_id");
    $(".loader").show();
    axios
        .post("/api/getTicketDetail", { ticket_id: ticket_id })

    .then((response) => setTicketDetail(response.data.Result[0]))
        .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

var attachFile = [];
var attachRejectFile = [];
var attachDisapproverFile = [];
var attachChangeDueDateFile = [];
var attachUpdateFile = [];
var attachOldFile = [];
var attachFileType = "";

function changeAttachFile() {
    $("#ticket_attachment_dev").on("change", function(event) {
        $("#files_selected_dev").empty();
        var files = $("#ticket_attachment_dev").get(0).files;
        var data = Array.from(files);

        for (const nfile of data) {
            const Files = attachFile.filter(item => typeof item === "string")
            const Files2 = attachFile.filter(item => typeof item === "object")

            const idx = Files.findIndex(name => name === nfile.name)
            const idx2 = Files2.findIndex(f => f.name === nfile.name)

            if (idx == -1 && idx2 == -1) {
                attachFile.push(nfile);
            }
        }

        // attachFile.push(...data)
        // attachFile = attachFile.filter((file, index, self) => index === self.findIndex((f) => f.name === file.name));

        for (let i = 0; i < attachFile.length; i++) {
            if (i == 0) {
                $("#files_selected_dev").append('<ul class="ul_files">');
            }

            var list_files =
                '<li class="li_files_dev' +
                i +
                '" data-index="' +
                i +
                '"><div">' +
                attachFile[i].name +
                '<img class="card-icon" id="bin_files_dev" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /></div></li>';
            $("#files_selected_dev").append(list_files);

            if (i == attachFile.length - 1) {
                $("#files_selected_dev").append("</ul>");
            }
        }
        event.target.value = null;
    });
    $("#ticket_attachment_dev_update").on("change", function(event) {
        $("#files_selected_dev_update").empty();
        var files = $("#ticket_attachment_dev_update").get(0).files;
        var data = Array.from(files);

        // attachUpdateFile.push(...data);
        // attachUpdateFile = attachUpdateFile.filter((file, index, self) => index === self.findIndex((f) => f.name === file.name));

        for (const nfile of data) {
            const Files = attachUpdateFile.filter(item => typeof item === "string")
            const Files2 = attachUpdateFile.filter(item => typeof item === "object")

            const idx = Files.findIndex(name => name === nfile.name)
            const idx2 = Files2.findIndex(f => f.name === nfile.name)

            if (idx == -1 && idx2 == -1) {
                attachUpdateFile.push(nfile);
            }
        }

        for (let i = 0; i < attachUpdateFile.length; i++) {
            if (i == 0) {
                $("#files_selected_dev_update").append('<ul class="ul_update_files">');
            }

            var list_files = "";
            if (typeof attachUpdateFile[i] === "string") {
                const newFile =
                    '<div style="float: right; cursor: pointer;">&nbsp;&nbsp;</div><a href="' +
                    attachUpdateFile[i] +
                    '" download><img class="card-icon" id="download_file_show" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a>';
                list_files =
                    '<li class="li_files_update_dev' +
                    i +
                    '"data-index="' +
                    i +
                    '"><div">' +
                    attachUpdateFile[i] +
                    '<img class="card-icon" id="bin_files_dev" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" />' +
                    newFile +
                    "</div></li>";
            } else {
                list_files =
                    '<li class="li_files_update_dev' +
                    i +
                    '"data-index="' +
                    i +
                    '"><div">' +
                    attachUpdateFile[i].name +
                    '<img class="card-icon" id="bin_files_dev" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /></div></li>';
            }

            $("#files_selected_dev_update").append(list_files);

            if (i == files.length - 1) {
                $("#files_selected_dev_update").append("</ul>");
            }
        }
        event.target.value = null;
    });
    $("#ticket_attachment_reject").on("change", function(event) {
        $("#files_selected_reject").empty();
        var files = $("#ticket_attachment_reject").get(0).files;
        var data = Array.from(files);

        // attachRejectFile.push(...data)
        // attachRejectFile = attachRejectFile.filter((file, index, self) => index === self.findIndex((f) => f.name === file.name));

        for (const nfile of data) {
            const Files = attachRejectFile.filter(item => typeof item === "string")
            const Files2 = attachRejectFile.filter(item => typeof item === "object")

            const idx = Files.findIndex(name => name === nfile.name)
            const idx2 = Files2.findIndex(f => f.name === nfile.name)

            if (idx == -1 && idx2 == -1) {
                attachRejectFile.push(nfile);
            }
        }

        for (let i = 0; i < attachRejectFile.length; i++) {
            if (i == 0) {
                $("#files_selected_reject").append('<ul class="ul_files">');
            }

            var list_files =
                '<li class="li_files_reject' +
                i +
                '" data-index="' +
                i +
                '"><div">' +
                attachRejectFile[i].name +
                '<img class="card-icon"  style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /></div></li>';
            $("#files_selected_reject").append(list_files);

            if (i == attachRejectFile.length - 1) {
                $("#files_selected_reject").append("</ul>");
            }
        }
        event.target.value = null;
    });
    $("#ticket_attachment_disapprove").on("change", function(event) {
        $("#files_selected_disapprove").empty();
        var files = $("#ticket_attachment_disapprove").get(0).files;
        var data = Array.from(files);

        for (const nfile of data) {
            const Files = attachDisapproverFile.filter(item => typeof item === "string")
            const Files2 = attachDisapproverFile.filter(item => typeof item === "object")

            const idx = Files.findIndex(name => name === nfile.name)
            const idx2 = Files2.findIndex(f => f.name === nfile.name)

            if (idx == -1 && idx2 == -1) {
                attachDisapproverFile.push(nfile);
            }
        }

        // attachDisapproverFile.push(...data)
        // attachDisapproverFile = attachDisapproverFile.filter((file, index, self) => index === self.findIndex((f) => f.name === file.name));

        for (let i = 0; i < attachDisapproverFile.length; i++) {
            if (i == 0) {
                $("#files_selected_disapprove").append('<ul class="ul_files">');
            }

            var list_files =
                '<li class="li_files_disapprove' +
                i +
                '" data-index="' +
                i +
                '"><div">' +
                attachDisapproverFile[i].name +
                '<img class="card-icon"  style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /></div></li>';
            $("#files_selected_disapprove").append(list_files);

            if (i == attachDisapproverFile.length - 1) {
                $("#files_selected_disapprove").append("</ul>");
            }
        }
        event.target.value = null;
    });
    $("#approver_attachment_disapprove").on("change", function(event) {
        $("#selected_approver_disapprove").empty();
        var files = $("#approver_attachment_disapprove").get(0).files;
        var data = Array.from(files);

        for (const nfile of data) {
            const Files = attachDisapproverFile.filter(item => typeof item === "string")
            const Files2 = attachDisapproverFile.filter(item => typeof item === "object")

            const idx = Files.findIndex(name => name === nfile.name)
            const idx2 = Files2.findIndex(f => f.name === nfile.name)

            if (idx == -1 && idx2 == -1) {
                attachDisapproverFile.push(nfile);
            }
        }

        // attachDisapproverFile.push(...data)
        // attachDisapproverFile = attachDisapproverFile.filter((file, index, self) => index === self.findIndex((f) => f.name === file.name));

        for (let i = 0; i < attachDisapproverFile.length; i++) {
            if (i == 0) {
                $("#selected_approver_disapprove").append('<ul class="ul_files">');
            }

            var list_files =
                '<li class="li_files_disapprove' +
                i +
                '" data-index="' +
                i +
                '"><div">' +
                attachDisapproverFile[i].name +
                '<img class="card-icon"  style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /></div></li>';
            $("#selected_approver_disapprove").append(list_files);

            if (i == attachDisapproverFile.length - 1) {
                $("#selected_approver_disapprove").append("</ul>");
            }
        }
        event.target.value = null;
    });
    var status = parseInt($("#status_ticket").val());
    console.log(status);
    $("#ticket_attachment_duedate").on("change", function(event) {
        $("#files_change_duedate").empty();
        var files = $("#ticket_attachment_duedate").get(0).files;
        console.log(files);
        var data = Array.from(files);

        for (const nfile of data) {
            const Files = attachChangeDueDateFile.filter(item => typeof item === "string")
            const Files2 = attachChangeDueDateFile.filter(item => typeof item === "object")

            const idx = Files.findIndex(name => name === nfile.name)
            const idx2 = Files2.findIndex(f => f.name === nfile.name)

            if (idx == -1 && idx2 == -1) {
                attachChangeDueDateFile.push(nfile);
            }
        }

        // attachChangeDueDateFile.push(...data)
        // attachChangeDueDateFile = attachChangeDueDateFile.filter((file, index, self) => index === self.findIndex((f) => f.name === file.name));

        for (let i = 0; i < attachChangeDueDateFile.length; i++) {
            if (i == 0) {
                $("#files_change_duedate").append('<ul class="ul_files">');
            }

            var list_files =
                '<li class="li_files_duedate' +
                i +
                '" data-index="' +
                i +
                '"><div">' +
                attachChangeDueDateFile[i].name +
                '<img class="card-icon"  style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /></div></li>';
            $("#files_change_duedate").append(list_files);

            if (i == attachChangeDueDateFile.length - 1) {
                $("#files_change_duedate").append("</ul>");
            }
        }

        if (![1, 6, 7, 8].includes(status)) {
            $("#btn_change_duedate").show();
        }
        event.target.value = null;
    });
}

function deletefile(element) {
    const index = $(element).closest("li").data("index");
    const classList = $(element).closest("li").attr("class");
    $(element).closest("li").remove();
    if (classList.startsWith("li_files_dev")) {
        attachFile.splice(index, 1);
        $('[class^="li_files_dev"]').each(function(i) {
            $(this).attr("data-index", i);
        });
    } else if (classList.startsWith("li_files_update_dev")) {
        attachUpdateFile.splice(index, 1);
        $('[class^="li_files_update_dev"]').each(function(i) {
            $(this).attr("data-index", i);
        });
    } else if (classList.startsWith("li_files_reject")) {
        attachRejectFile.splice(index, 1);
        $('[class^="li_files_reject"]').each(function(i) {
            $(this).attr("data-index", i);
        });
    } else if (classList.startsWith("li_files_disapprove")) {
        attachDisapproverFile.splice(index, 1);
        $('[class^="li_files_disapprove"]').each(function(i) {
            $(this).attr("data-index", i);
        });
    } else if (classList.startsWith("li_files_duedate")) {
        attachChangeDueDateFile.splice(index, 1);
        $('[class^="li_files_duedate"]').each(function(i) {
            $(this).attr("data-index", i);
        });
    }
}

async function setTicketDetail(data) {
    await getTicketType(data);
    await getSeverity(data);
    await getLevel(data);

    $("#ticket_no").val(data.ticket_no);
    $("#ticket_name").val(data.ticket_name);
    let department_id = data.department_id;
    ticket_level_id = data.ticket_level_id;

    $("#ticket_department_selected").val(department_id).change();

    $("#selected_approve_star_manager").hide();
    $("#selected_approve_star_user").hide();
    $("#textarea_note_disapprove").hide();
    $("#textarea_approver_disapprove").hide();
    $("#last_operator_disapprove").hide();
    $("#textarea_note_reject").hide();
    $("#file_user").hide();
    $("#file_dev").hide();
    $("#add_file_dev").hide();
    $("#update_file_dev").hide();
    $("#show_file_dev").hide();
    $("#form_reject_description").hide();
    $("#form_file_approver_reject").hide();
    $("#form_add_activity").hide();
    $("#form_button_add_task_detail").hide();

    $("#form_disapprover_description").hide();
    $("#form_file_disapprover").hide();
    $("#label_ticket_attachment_disapprove").hide();
    $("#form_file_user_reject_to_approver").hide();
    $("#file_user_reject").hide();
    $("#note_user_reject").hide();
    $("#custom_duedate").hide();
    $("#note_duedate").hide();
    // console.log(data.status_id);
    $("#status_ticket").val(data.status_id);

    if (data.ticket_progress || data.ticket_progress >= 0) {
        $("#form_activity_detail").show();
    } else {
        $("#form_activity_detail").hide();
    }

    if (data.status_id > 1 && parseInt($("#severity_detail").val()) != 5) {
        $("#custom_duedate").show();
    }

    if (data.status_id > 1 && data.status_id != 3) {
        $("#ticket_due_date_manager").css("background-color", "#e9ecef");
        $("#ticket_due_date_manager").css("color", "#212529");
        $("#ticket_due_date_manager").prop("readonly", true);
    }

    if (data.status_id == 8) {
        $("#ticket_note_cancel").val(data.ticket_cancel_remark_user);
    } else {
        $("#textarea_note_cancel").hide();
    }

    if (data.ticket_remark_approver_change_due_date) {
        $("#note_duedate").show();
        $(".btn_file_duedate").hide();
        $("#custom_due_date").prop("checked", true);
        $("#custom_due_date").prop("disabled", true);
        $("#duedate_remark").val(data.ticket_remark_approver_change_due_date);

        if (data.status_id != 7 || data.status_id != 8) {
            $("#duedate_remark").prop("disabled", false);
            $("#ticket_due_date_manager").prop("disabled", false);
            $(".btn_file_duedate").show();
        } else {
            $("#duedate_remark").prop("disabled", true);
            $("#ticket_due_date_manager").prop("disabled", true);
        }
        if (data.ticket_attachment_approver_change_due_date) {
            var attachDDFileName = [];
            var attachDDFile = data.ticket_attachment_approver_change_due_date.split("|");
            for (let i = 0; i < attachDDFile.length; i++) {
                attachDDFileName[i] = attachDDFile[i].split("attachment/");
                if (i == 0) {
                    $("#files_change_duedate").append('<ul class="ul_files">');
                }

                var listDDfiles =
                    '<li class="li_files' +
                    i +
                    '"><div">' +
                    attachDDFileName[i][1] +
                    '<a href="' +
                    attachDDFile[i] +
                    '" download><img class="card-icon" id="download_file" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
                $("#files_change_duedate").append(listDDfiles);

                if (i == attachDDFile.length - 1) {
                    $("#files_change_duedate").append("</ul>");
                }
            }
        }
    }

    if (data.ticket_attachment_user) {
        $("#file_user").show();

        var attachFile_user = data.ticket_attachment_user;
        var attachFileName_user = [];

        if (attachFile_user) {
            attachFile_user = attachFile_user.split("|");
            for (let i = 0; i < attachFile_user.length; i++) {
                attachFileName_user[i] = attachFile_user[i].split("attachment/");
                if (i == 0) {
                    $("#files_selected").append('<ul class="ul_files">');
                }

                var list_files =
                    '<li class="li_files' +
                    i +
                    '"><div">' +
                    attachFileName_user[i][1] +
                    '<a href="' +
                    attachFile_user[i] +
                    '" download><img class="card-icon" id="download_file" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
                $("#files_selected").append(list_files);

                if (i == attachFile_user.length - 1) {
                    $("#files_selected").append("</ul>");
                }
            }
        }
    }

    if (data.ticket_attachment_dev) {
        if (data.status_id > 3) {
            $("#show_file_dev").show();
            var attachFile_dev = data.ticket_attachment_dev;
            //console.log(attachFile_dev);
            var attachFileName_dev = [];

            if (attachFile_dev) {
                attachFile_dev = attachFile_dev.split("|");
                for (let i = 0; i < attachFile_dev.length; i++) {
                    attachFileName_dev[i] = attachFile_dev[i].split("attachment/");
                    //console.log(attachFileName_dev[i][1])
                    if (i == 0) {
                        $("#show_files_selected_dev").append('<ul class="ul_files">');
                    }

                    var list_files_dev =
                        '<li class="li_show_files_dev' +
                        i +
                        '"><div">' +
                        attachFileName_dev[i][1] +
                        '<a href="' +
                        attachFile_dev[i] +
                        '" download><img class="card-icon" id="download_file_show" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
                    $("#show_files_selected_dev").append(list_files_dev);

                    if (i == attachFile_dev.length - 1) {
                        $("#show_files_selected_dev").append("</ul>");
                    }
                }
            }
        } else if (data.status_id === 3) {
            var attachFile_dev = data.ticket_attachment_dev;
            var attachFileName_dev = [];
            if (attachFile_dev) {
                attachFile_dev = attachFile_dev.split("|");
                for (let i = 0; i < attachFile_dev.length; i++) {
                    attachFileName_dev[i] = attachFile_dev[i].split("attachment/");
                    attachOldFile.push(attachFileName_dev[i][1]);
                    attachUpdateFile.push(attachFileName_dev[i][1]);
                    if (i == 0) {
                        $("#files_selected_dev_update").append(
                            '<ul class="ul_update_files">'
                        );
                    }

                    var list_files_dev =
                        '<li class="li_files_update_dev' +
                        i +
                        '" data-index="' +
                        i +
                        '"><div">' +
                        attachFileName_dev[i][1] +
                        '<img class="card-icon" id="bin_files_dev" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /><div style="float: right; cursor: pointer;">&nbsp;&nbsp;</div><a href="' +
                        attachFile_dev[i] +
                        '" download><img class="card-icon" id="download_file_show" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';

                    $("#files_selected_dev_update").append(list_files_dev);

                    if (i == attachFile_dev.length - 1) {
                        $("#files_selected_dev_update").append("</ul>");
                    }
                }
            }
        }
    }

    var ticket_date = moment(data.ticket_datetime).format("YYYY-MM-DD HH:mm:ss");
    $("#ticket_date").val(ticket_date);

    if (data.ticket_start_date) {
        var ticket_start_date = moment(data.ticket_start_date).format("YYYY-MM-DD");
        $("#ticket_start_date").val(ticket_start_date);
    }

    if (data.ticket_end_date) {
        var ticket_end_date = moment(data.ticket_end_date).format("YYYY-MM-DD");
        $("#ticket_end_date").val(ticket_end_date);
    }

    var ticket_due_date_user = moment(data.ticket_due_date_user).format(
        "YYYY-MM-DD"
    );
    $("#ticket_due_date_user").val(ticket_due_date_user);

    if (data.ticket_due_date_manager) {
        var ticket_due_date_manager = moment(data.ticket_due_date_manager).format(
            "YYYY-MM-DD"
        );
        $("#ticket_due_date_manager").val(ticket_due_date_manager);
    }

    if (data.status_id != 6 && data.status_id != 10 && data.status_id != 11) {
        setRating();
    }

    // if (user_type == 1 && data.status_id == 6 && (data.ticket_rating_user == 0 || !data.ticket_rating_user)) {
    //     setRatingUser();
    // }

    $("#ticket_objective").val(data.ticket_objective);
    $("#ticket_description").val(data.ticket_description);
    $("#ticket_type_selected").val(data.ticket_type_id).change();
    $("#ticket_category_selected").val(data.category_id).change();

    if (data.user_firstname && data.user_lastname) {
        var user_name = data.user_firstname + " " + data.user_lastname;
        $("#user_name").html(user_name);
    }

    if (data.manager_firstname && data.manager_lastname) {
        var manager_name = data.manager_firstname + " " + data.manager_lastname;
        $("#manager_name").html(manager_name);
    }

    if (data.dev_firstname && data.dev_lastname) {
        var programmer_name = data.dev_firstname + " " + data.dev_lastname;
        $("#programmer_name").html(programmer_name);
    }

    if (data.status_id == 7) {
        $("#ticket_type_selected").prop("disabled", true);
        $("#ticket_category_selected").prop("disabled", true);
        $("#ticket_start_date").prop("disabled", true);
        $("#ticket_due_date_manager").prop("disabled", true);
        $("#label_programmer_name").hide();
        $("#ticket_programmer_selected").select2().next().hide();
        $("#selected_approve").hide();
        $("#selected_approve2").hide();
        $("#btn_approve_ticket").hide();
        $("#btn_approve_ticket2").hide();
        $("#btn_confirm_ticket").hide();
        $("#btn_complete_ticket").hide();
        $("#form_activity_detail").hide();
    }

    if (data.reject_desciption) {
        $("#form_reject_description").show();
        $("#form_file_approver_reject").show();
        $("#reject_description").val(data.reject_desciption);
        if (data.reject_attachment) {
            $("#form_file_approver_reject").show();
            var attachFileReject = data.reject_attachment.split("|");
            var attachFileNameReject = [];
            for (let i = 0; i < attachFileReject.length; i++) {
                attachFileNameReject[i] = attachFileReject[i].split("attachment/");
                if (i == 0) {
                    $("#files_approver_reject").append('<ul class="ul_files">');
                }

                var list_files =
                    '<li class="li_file_approver_reject' +
                    i +
                    '" data-index="' +
                    i +
                    '"><div">' +
                    attachFileNameReject[i][1] +
                    '<a href="' +
                    attachFileReject[i] +
                    '" download><img class="card-icon" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
                $("#files_approver_reject").append(list_files);

                if (i == attachFileReject.length - 1) {
                    $("#files_approver_reject").append("</ul>");
                }
            }
        } else {
            $("#form_file_approver_reject").hide();
        }
    }

    if (data.ticket_disapprove_remark_user) {
        $("#form_disapprover_description").show();
        $("#disapprover_description").val(data.ticket_disapprove_remark_user);

        if (data.ticket_attachment_approver_disapprove) {
            $("#form_file_disapprover").show();
            var attachFileDisapprover =
                data.ticket_attachment_approver_disapprove.split("|");
            var attachFileNameDisapprover = [];
            for (let i = 0; i < attachFileDisapprover.length; i++) {
                attachFileNameDisapprover[i] =
                    attachFileDisapprover[i].split("attachment/");
                if (i == 0) {
                    $("#files_approver_disapprover").append('<ul class="ul_files">');
                }

                var list_files =
                    '<li class="li_file_approver_disapprover' +
                    i +
                    '" data-index="' +
                    i +
                    '"><div">' +
                    attachFileNameDisapprover[i][1] +
                    '<a href="' +
                    attachFileDisapprover[i] +
                    '" download><img class="card-icon" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
                $("#files_approver_disapprover").append(list_files);

                if (i == attachFileDisapprover.length - 1) {
                    $("#files_approver_disapprover").append("</ul>");
                }
            }
        } else {
            $("#form_file_disapprover").hide();
        }
    }

    if (data.ticket_note) {
        $("#last_operator_disapprove").show();
        $("#last_selected_disapprove").val(data.ticket_note);

        if (data.ticket_attachment_disapprove_operator) {
            var attachFileDisapprover =
                data.ticket_attachment_disapprove_operator.split("|");
            var attachFileNameDisapprover = [];
            for (let i = 0; i < attachFileDisapprover.length; i++) {
                attachFileNameDisapprover[i] =
                    attachFileDisapprover[i].split("attachment/");
                if (i == 0) {
                    $("#last_file_selected_disapprove").append('<ul class="ul_files">');
                }

                var list_files =
                    '<li class="li_last_operator_disapprover' +
                    i +
                    '" data-index="' +
                    i +
                    '"><div">' +
                    attachFileNameDisapprover[i][1] +
                    '<a href="' +
                    attachFileDisapprover[i] +
                    '" download><img class="card-icon" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
                $("#last_file_selected_disapprove").append(list_files);

                if (i == attachFileDisapprover.length - 1) {
                    $("#last_file_selected_disapprove").append("</ul>");
                }
            }
        }
    }

    if (data.status_id == 9) {
        $("#ticket_type_selected").prop("disabled", true);
        $("#ticket_category_selected").prop("disabled", true);
        $("#ticket_start_date").prop("disabled", true);
        $("#ticket_due_date_manager").prop("disabled", true);
        $("#label_programmer_name").hide();
        $("#ticket_programmer_selected").select2().next().hide();
        $("#selected_approve").hide();
        $("#selected_approve2").hide();
        $("#btn_approve_ticket").hide();
        $("#btn_approve_ticket2").hide();
        $("#btn_confirm_ticket").hide();
        $("#btn_complete_ticket").hide();
        $("#form_activity_detail").hide();
    }

    const ticket_project_name = data.ticket_project_code;
    const option = $("#ticket_project_name option").filter(function() {
        return $(this).val() == ticket_project_name;
    });

    if (option.length == 1) {
        // $('#ticket_project_name').val(ticket_project_name);
        $("#ticket_project_name").val(ticket_project_name).change();
        $("#ticket_project_name_other_form").hide();
        $("#ticket_project_name option")
            .filter(function() {
                return $(this).val() == ticket_project_name;
            })
            .prop("selected", true);

        // if (data.status_id != 9) {
        $("#form_ticket_project_name_other_checkbox").hide();
        $("#ticket_project_name").prop("disabled", true);
        // }
    } else {
        $("#ticket_project_name_other").val(ticket_project_name);
        $("#ticket_project_name").select2().next().hide();
        // if (data.status_id != 9) {
        $("#ticket_project_name_other").prop("disabled", true);
        $("#ticket_project_name").hide();
        $("#ticket_project_name_other_checkbox").prop("checked", true);
        $("#ticket_project_name_other_checkbox").prop("disabled", true);
        // } else {
        //     $('#ticket_project_name_other_checkbox').prop('checked', true);
        //     $("#ticket_project_name").prop("disabled", true);
        // }
    }

    $("#btn_revise_ticket").hide();
    $("#btn_rating_user").hide();

    if (data.status_id != 1 && data.status_id != 7 && data.status_id != 9) {
        const programmer_data = data.ticket_programmer.split(",");
        var ticket_dev = [];

        for (let i = 0; i < programmer_data.length; i++) {
            ticket_dev.push(programmer_data[i]);
        }

        devDB = ticket_dev;
        console.log(ticket_dev);

        await getProgrammer(department_id, ticket_dev, data);
    }
    changeDev();

    $("#programmer_signature").hide();
    $("#clearSignProgrammer").hide();

    var manager_name =
        $("#user_first_name").val() + " " + $("#user_last_name").val();
    $("#manager_name").html(manager_name);

    $("#btn_approve_confirm").hide();
    $("#btn_change_duedate").hide();
    $("#btn_changedev_confirm").hide();
    $("#btn_confirm_ticket").hide();
    $("#btn_complete_ticket").hide();
    $("#btn_edit_dev").hide();
    $("#btn_success").hide();
    $("#file_programmer_signature").hide();
    $("#btn_accept_user_reject").hide();

    if (data.ticket_signature_dev) {
        ticket_sign_programmer_img = data.ticket_signature_dev;
        $("#ticket_sign_programmer").attr("src", data.ticket_signature_dev);
    } else {
        $("#ticket_sign_programmer").attr(
            "src",
            "../public/images/sign/sign_null.png"
        );
        // $('#ticket_programmer').hide();
    }

    if (data.status_id == 1) {
        $("#label_programmer_name").hide();
        $("#ticket_programmer_selected").select2().next().hide();
        $("#ticket_start_date").css("background-color", "white");
        $("#ticket_start_date").css("color", "black");
        var $selectAll = $("input:radio[name=inlineRadioOptions]");
        $selectAll.on("change", async function() {
            if ($(this).val() == "Approve") {
                $("#textarea_approver_disapprove").hide();
                $("#textarea_note_reject").hide();
                $("#ticket_start_date").prop("disabled", false);
                $("#ticket_start_date").css("background-color", "white");
                $("#ticket_start_date").css("color", "black");
                $("#ticket_due_date_manager").prop("disabled", false);
                $("#ticket_type_selected").prop("disabled", false);
                $("#ticket_category_selected").prop("disabled", false);
                $("#level_detail").prop("disabled", false);
                $("#label_programmer_name").show();
                $("#ticket_programmer_selected")
                    .select2({
                        placeholder: "Please select operator",
                        allowClear: true,
                    })
                    .next()
                    .show();
                $("#ticket_programmer_selected").empty();
                var department_id = $("#ticket_department_selected").val();
                console.log(department_id);
                if (department_id == 3) {
                    $("#severity_detail").prop("disabled", false);
                    var start_date = $("#ticket_start_date").val();
                    var severity = $("#severity_detail").val();
                    console.log("start_date", start_date);
                    console.log("severity", severity);
                    if (severity != 5) {
                        $("#ticket_due_date_manager").prop("disabled", true);
                    } else {
                        $("#ticket_due_date_manager").prop("disabled", false);
                    }
                    if (start_date && severity) {
                        $("#custom_duedate").show();
                    } else {
                        $("#custom_duedate").hide();
                    }

                } else {
                    $("#severity_detail").prop("disabled", true);
                }
                await getProgrammer(department_id, null, data);

                $("#ticket_programmer_selected").on("change", function() {
                    var programmer = $("#ticket_programmer_selected").select2("data");
                    $("#programmer_name").html("");
                    $("#programmer_signature").hide();
                    $("#clearSignProgrammer").hide();
                    $("#file_programmer_signature").hide();
                    $("#ticket_sign_programmer").show();
                    $("#btn_approve_confirm").hide();
                    $("#btn_approve_ticket").show();
                    $("#form_add_activity").hide();
                    if (data.ticket_signature_dev) {
                        ticket_sign_programmer_img = data.ticket_signature_dev;
                        $("#ticket_sign_programmer").attr("src", data.ticket_signature_dev);
                    } else {
                        $("#ticket_sign_programmer").attr(
                            "src",
                            "../public/images/sign/sign_null.png"
                        );
                    }
                    $("#programmer_signature").empty();
                    for (let i = 0; i < programmer.length; i++) {
                        console.log(programmer[i].text, manager_name);
                        if (programmer[i].text == manager_name) {
                            $("#programmer_name").html(manager_name);
                            $("#programmer_signature").show();
                            $("#clearSignProgrammer").show();
                            $("#file_programmer_signature").show();
                            $("#programmer_signature").jSignature();
                            $("#ticket_sign_programmer").hide();
                            $("#btn_approve_confirm").show();
                            $("#btn_approve_ticket").hide();
                            $("#form_add_activity").show();
                        }
                    }
                });
            } else if ($(this).val() == "Disapprove") {
                $("#textarea_approver_disapprove").show();
                $("#label_programmer_name").hide();
                $("#textarea_note_reject").hide();
                $("#ticket_programmer_selected").select2().next().hide();
                $("#ticket_start_date").val("");
                $("#ticket_due_date_manager").val("");
                $("#ticket_due_date_manager").prop("disabled", true);
                $("#ticket_type_selected").val(null).trigger("change");
                $("#ticket_type_selected").prop("disabled", true);
                $("#ticket_category_selected").val(null).trigger("change");
                $("#ticket_category_selected").prop("disabled", true);
                $('#custom_due_date').prop('checked', false);
                $("#custom_duedate").hide();

                var department_id = $("#ticket_department_selected").val();
                if (department_id == 3) {
                    $("#severity_detail").val(null).trigger("change");
                    $("#files_change_duedate").empty();
                }
                $("#severity_detail").prop("disabled", true);
                $("#level_detail").val(null).trigger("change");
                $("#level_detail").prop("disabled", true);
                $("#ticket_programmer_selected").val(null).trigger("change");
                $("#ticket_start_date").prop("disabled", true);
                $("#ticket_start_date").css("background-color", "#e9ecef");
                $("#ticket_due_date_manager").css("background-color", "#e9ecef");
                $("#duedate_remark").val("");
                $("#note_duedate").hide();
            } else if ($(this).val() == "Reject") {
                $("#textarea_approver_disapprove").hide();
                $("#textarea_note_reject").show();
                $("#label_programmer_name").hide();
                $("#ticket_programmer_selected").select2().next().hide();
                $("#ticket_start_date").prop("disabled", true);
                $("#ticket_due_date_manager").prop("disabled", true);
                $("#ticket_start_date").val("");
                $("#ticket_due_date_manager").val("");
                $("#ticket_due_date_manager").prop("disabled", true);
                $("#ticket_type_selected").val(null).trigger("change");
                $("#ticket_type_selected").prop("disabled", true);
                $("#ticket_category_selected").val(null).trigger("change");
                $("#ticket_category_selected").prop("disabled", true);
                $('#custom_due_date').prop('checked', false);
                $("#custom_duedate").hide();
                var department_id = $("#ticket_department_selected").val();
                if (department_id == 3) {
                    $("#severity_detail").val(null).trigger("change");
                    $("#files_change_duedate").empty();
                }
                $("#severity_detail").prop("disabled", true);
                $("#level_detail").val(null).trigger("change");
                $("#level_detail").prop("disabled", true);
                $("#ticket_programmer_selected").val(null).trigger("change");
                $("#ticket_start_date").css("background-color", "#e9ecef");
                $("#ticket_due_date_manager").css("background-color", "#e9ecef");
                $("#duedate_remark").val("");
                $("#note_duedate").hide();
            }
        });

        $("#selected_approve2").hide();
        $("#btn_approve_ticket2").hide();
        $("#status_head").append(
            "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #C433FF;'>Waiting manager approve</span></h5></div>"
        );
    }

    if (
        data.status_id == 2 ||
        data.status_id == 3 ||
        data.status_id == 6 ||
        data.status_id == 8
    ) {
        $("#selected_approve").hide();
        $("#selected_approve2").hide();
        $("#btn_approve_ticket").hide();
        $("#btn_approve_confirm").hide();
        $("#btn_approve_ticket2").hide();
        $("#btn_success").hide();
        $("#file_manager_signature").hide();
        $("#btn_edit_dev").hide();
        // $('#ticket_programmer_selected').val(ticket_dev).change();
        // var programmer = $('#ticket_programmer_selected').select2('data');

        $(".loader").hide();
        if (data.status_id == 2) {
            // $('#btn_edit_dev').show();
            $("#ticket_type_selected").val(data.ticket_type_id).change();
            $("#ticket_category_selected").val(data.category_id).change();
            $("#ticket_type_selected").prop("disabled", true);
            $("#ticket_category_selected").prop("disabled", true);
            $("#status_head").append(
                "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #F7BA5E;'>Waiting programmer confirm</span></h5></div>"
            );
        } else if (data.status_id == 3) {
            $("#ticket_type_selected").val(data.ticket_type_id).change();
            $("#ticket_category_selected").val(data.category_id).change();
            $("#ticket_type_selected").prop("disabled", true);
            $("#ticket_category_selected").prop("disabled", true);
            $("#btn_edit_dev").show();
            $("#btn_success").hide();
            $("#selected_approve_star_manager").hide();
            $("#status_head").append(
                "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #61D9FF;'>In Process</span></h5></div>"
            );

            const ticket_due_date_manager = moment(
                data.ticket_due_date_manager
            ).format("YYYY-MM-DD");

            $("#ticket_due_date_manager").datepicker({
                format: "yyyy-mm-dd",
                todayHighlight: "TRUE",
                autoclose: true,
                startDate: ticket_start_date,
            });

            $("#ticket_due_date_manager").on("change", async function() {
                let due_date = $("#ticket_due_date_manager").val();
                if (due_date != ticket_due_date_manager) {
                    $("#form_button_add_task_detail").show();
                    $("#btn_change_duedate").show();
                    $("#note_duedate").show();
                    $(".btn_file_duedate").show();
                    $("#duedate_remark").prop("disabled", false);
                } else {
                    $("#form_button_add_task_detail").hide();
                    $("#btn_change_duedate").hide();
                    await getTaskActivityByTicket(data.ticket_id, data.status_id);
                }
            });
        } else if (data.status_id == 6) {
            $("#ticket_type_selected").val(data.ticket_type_id).change();
            $("#ticket_category_selected").val(data.category_id).change();
            $("#ticket_type_selected").prop("disabled", true);
            $("#ticket_category_selected").prop("disabled", true);
            $("#ticket_programmer_selected").prop("disabled", true);
            $("#selected_approve_star_manager").show();
            $("#btn_changedev_confirm").hide();
            $(".ratingW").prop("disabled", true);
            var stars = $(".ratingW").find("li");
            for (let i = 0; i < data.ticket_rating; i++) {
                $(".scoreNow").html(data.ticket_rating);
                stars.eq(i).addClass("on");
            }

            $("#selected_approve_star_user").show();
            var stars2 = $(".ratingW2").find("li");
            for (let i = 0; i < data.ticket_rating_user; i++) {
                $(".scoreNow2").html(data.ticket_rating_user);
                stars2.eq(i).addClass("on");
            }

            $("#status_head").append(
                "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #0FCA7A;'>Success</span></h5></div>"
            );
        } else if (data.status_id == 8) {
            $("#ticket_type_selected").prop("disabled", true);
            $("#ticket_category_selected").prop("disabled", true);
            $("#ticket_start_date").prop("disabled", true);
            $("#ticket_due_date_manager").prop("disabled", true);
            $("#ticket_programmer_selected").prop("disabled", true);
            $("#file_manager_signature").hide();
            $("#status_head").append(
                "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #808080;'>Cancel</span></h5></div>"
            );
        }
    }

    if (data.status_id == 4) {
        $("#duedate_remark").prop("disabled", true);
        $(".btn_file_duedate").hide();
        $("#ticket_type_selected").val(data.ticket_type_id).change();
        $("#ticket_category_selected").val(data.category_id).change();
        $("#ticket_type_selected").prop("disabled", true);
        $("#ticket_category_selected").prop("disabled", true);
        $("#ticket_programmer_selected").val(ticket_dev).change();
        $("#ticket_programmer_selected").prop("disabled", true);
        $("#selected_approve").hide();
        $("#btn_approve_ticket").hide();
        $("#file_manager_signature").hide();
        $("#btn_changedev_confirm").hide();
        $("#status_head").append(
            "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #7F5A58;'>Project complete, waiting manager approve</span></h5></div>"
        );
    }

    if (data.status_id == 5) {
        $("#ticket_type_selected").val(data.ticket_type_id).change();
        $("#ticket_category_selected").val(data.category_id).change();
        $("#ticket_type_selected").prop("disabled", true);
        $("#ticket_category_selected").prop("disabled", true);
        $("#ticket_programmer_selected").val(ticket_dev).change();
        $("#ticket_programmer_selected").prop("disabled", true);
        // $("#btn_edit_dev").show();
        $("#selected_approve").hide();
        $("#selected_approve2").hide();
        $("#btn_approve_ticket").hide();
        $("#btn_approve_ticket2").hide();
        $("#ticket_disapprove_note").prop("disabled", true);
        $("#file_manager_signature").hide();
        $("#status_head").append(
            "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #FB95FB;'>Disapprove project (Operator)</span></h5></div>"
        );
    }

    if (data.status_id == 7) {
        $("#label_programmer_name").hide();
        $("#ticket_programmer_selected").select2().next().hide();
        $("#file_manager_signature").hide();
        $("#status_head").append(
            "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #F75D5F;'> Dispprove (User)</span></h5></div>"
        );
    }

    if (data.status_id == 9) {
        $("#label_programmer_name").hide();
        $("#ticket_programmer_selected").select2().next().hide();
        $("#file_manager_signature").hide();
        $("#status_head").append(
            "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #ff6f00;'>Reject</span></h5></div>"
        );
    }

    if (data.status_id == 10) {
        $("#selected_approve").hide();
        $("#selected_approve2").hide();
        $("#btn_approve_ticket").hide();
        $("#btn_approve_ticket2").hide();
        $("#ticket_reject_approver_note_detail").val(data.reject_user_desciption);
        $("#ticket_type_selected").prop("disabled", true);
        $("#ticket_category_selected").prop("disabled", true);
        $("#ticket_programmer_selected").prop("disabled", true);

        if (data.reject_user_attachment) {
            var attachFile_user = data.reject_user_attachment.split("|");
            var attachFileName_user = [];
            for (let i = 0; i < attachFile_user.length; i++) {
                attachFileName_user[i] = attachFile_user[i].split("attachment/");
                if (i == 0) {
                    $("#files_selected_reject_to_approver").append(
                        '<ul class="ul_files">'
                    );
                }

                var list_files =
                    '<li class="li_files' +
                    i +
                    '"><div">' +
                    attachFileName_user[i][1] +
                    '<a href="' +
                    attachFile_user[i] +
                    '" download><img class="card-icon" id="download_file" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
                $("#files_selected_reject_to_approver").append(list_files);

                if (i == attachFile_user.length - 1) {
                    $("#files_selected_reject_to_approver").append("</ul>");
                }
            }
        }

        $(".ratingW").prop("disabled", true);
        var stars = $(".ratingW").find("li");
        for (let i = 0; i < data.ticket_rating; i++) {
            $(".scoreNow").html(data.ticket_rating);
            stars.eq(i).addClass("on");
        }

        // $("#selected_approve_star_manager").hide()
        $("#selected_approve_star_manager").show();
        $("#file_manager_signature").hide();

        $("#status_head").append(
            "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #DFD187;'>Waiting user approve</span></h5></div>"
        );
    }

    if (data.status_id == 11) {
        $("#form_file_user_reject_to_approver").show();
        $("#selected_approve_star_manager").hide();
        $("#selected_approve").hide();
        $("#selected_approve2").hide();
        $("#btn_approve_ticket").hide();
        $("#btn_approve_ticket2").hide();
        $("#ticket_reject_approver_note_detail").val(data.reject_user_desciption);
        $("#btn_accept_user_reject").show();
        $("#ticket_type_selected").prop("disabled", true);
        $("#ticket_category_selected").prop("disabled", true);

        if (data.reject_user_desciption) {
            $("#note_user_reject").show();
        }
        if (data.reject_user_attachment) {
            $("#file_user_reject").show();
            var attachFile_user = data.reject_user_attachment.split("|");
            var attachFileName_user = [];
            for (let i = 0; i < attachFile_user.length; i++) {
                attachFileName_user[i] = attachFile_user[i].split("attachment/");
                if (i == 0) {
                    $("#files_selected_reject_to_approver").append(
                        '<ul class="ul_files">'
                    );
                }

                var list_files =
                    '<li class="li_files' +
                    i +
                    '"><div">' +
                    attachFileName_user[i][1] +
                    '<a href="' +
                    attachFile_user[i] +
                    '" download><img class="card-icon" id="download_file" style="float: right; cursor: pointer;" src="../public/images/icon/downloads.png"/></a></div></li>';
                $("#files_selected_reject_to_approver").append(list_files);

                if (i == attachFile_user.length - 1) {
                    $("#files_selected_reject_to_approver").append("</ul>");
                }
            }
        }
        $("#file_manager_signature").hide();

        $("#status_head").append(
            "<div id='status_head_detail'><h5><span class='badge text-white' style='border-radius: 10px; background-color: #B89169;'>User Reject</span></h5></div>"
        );
    }

    // if((data.dev_firstname && data.dev_lastname) || data.status_id == 7){
    //     $('#label_programmer_name').hide();
    //     $("#ticket_programmer_selected").select2().next().hide();
    // }
    var dateToday = new Date();
    if (!data.ticket_start_date && data.status_id != 7 && data.status_id != 9) {
        $("#ticket_start_date").prop("disabled", false);
        $("#ticket_start_date").datepicker({
            format: "yyyy-mm-dd",
            todayHighlight: "TRUE",
            autoclose: true,
            minDate: dateToday,
            startDate: dateToday,
        });
    }

    if (!data.ticket_due_date_manager && data.status_id != 7) {
        // $("#ticket_due_date_manager").prop("disabled", false);

        $("#ticket_due_date_manager").datepicker({
            format: "yyyy-mm-dd",
            todayHighlight: "TRUE",
            autoclose: true,
            showButtonPanel: true,
            minDate: dateToday,
            startDate: dateToday,
        });
    }

    if (data.ticket_signature_manager) {
        $("#ticket_sign_manager").attr("src", data.ticket_signature_manager);
        $("#manager_signature").hide();
        $("#clearSignManager").hide();
    } else {
        $("#manager_signature").jSignature();
    }

    $("#label_task_activity").hide();
    if (data.status_id > 2) {
        $("#label_task_activity").show();
        await getTaskActivityByTicket(data.ticket_id, data.status_id);
    }

    if (data.ticket_signature_user) {
        $("#ticket_sign_user").attr("src", data.ticket_signature_user);
    }

    if (data.status_id >= 4) {
        $("#custom_duedate").hide();
    }
    changeDueDateApprover();
    changeAttachFile();

    $(".loader").hide();
}

async function getTaskActivityByTicket(ticket_id, status_id) {
    try {
        const response = await axios.post("/api/getTaskActivityByTicket", {
            ticket_id,
        });
        setTaskActivity(response.data.Result, status_id);
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: err,
        });
    }
}

function setTaskActivity(data, status_id) {
    if (data.length == 0) {
        $("#form_activity_detail").hide();
    }
    $("#input-container-detail").html("");
    let container = document.getElementById("input-container-detail");
    const fragment = document.createDocumentFragment();
    data.forEach(
        ({ task_activity_id, task_activity_description, task_activity_complete },
            index
        ) => {
            const div = document.createElement("div");
            div.classList.add("input-group", "mb-1");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "checkbox[]";
            checkbox.value = index + 1;
            checkbox.id = "checkbox-detail-" + index;
            checkbox.checked = task_activity_complete;
            checkbox.classList.add("me-2");

            const span = document.createElement("span");
            span.classList.add("input-group-text", "input-index");
            span.textContent = index + 1;

            const input = document.createElement("input");
            input.type = "text";
            input.classList.add("form-control");
            input.name = "input-detail[]";
            input.id = "input-detail-" + index;
            input.value = task_activity_description;
            input.setAttribute("data-id", task_activity_id);

            input.disabled = true;
            checkbox.disabled = true;

            div.appendChild(checkbox);
            div.appendChild(span);
            div.appendChild(input);

            fragment.appendChild(div);
        }
    );

    container.appendChild(fragment);
    calculateProgress(status_id);
}

function changeSign() {
    $("#manager_signature").bind("change", function(e) {
        if ($("#manager_signature").jSignature("getData", "native").length != 0) {
            $("#fileManagersignature").prop("disabled", true);
        } else {
            $("#fileManagersignature").prop("disabled", false);
        }
    });

    $("#fileManagersignature").on("change", function() {
        var filesign = $("#fileManagersignature").get(0).files[0];
        if (filesign) {
            $("#manager_signature").hide();
            $("#ticket_sign_manager").attr(
                "src",
                "../public/images/sign/sign_null.png"
            );
            $("#outputFileManagersignature").css("width", "517");
            $("#outputFileManagersignature").css("height", "129");
        } else {
            $("#manager_signature").show();
        }
    });

    $("#programmer_signature").bind("change", function(e) {
        if (
            $("#programmer_signature").jSignature("getData", "native").length != 0
        ) {
            $("#fileProgrammersignature").prop("disabled", true);
        } else {
            $("#fileProgrammersignature").prop("disabled", false);
        }
    });

    $("#fileProgrammersignature").on("change", function() {
        var filesign = $("#fileProgrammersignature").get(0).files[0];
        if (filesign) {
            $("#programmer_signature").hide();
            $("#ticket_sign_programmer").attr(
                "src",
                "../public/images/sign/sign_null.png"
            );
            $("#outputFileProgrammersignature").css("width", "517");
            $("#outputFileProgrammersignature").css("height", "129");
        } else {
            $("#programmer_signature").show();
        }
    });
}

function clearSign() {
    $("#clearSignManager").click(function(event) {
        $("#manager_signature").jSignature("reset");
        $("#fileManagersignature").prop("disabled", false);
        $("#manager_signature").show();
        $("#ticket_manager_signature").attr("src", "");
        $("#fileManagersignature").val("");
        $("#outputFileManagersignature").attr("src", "");
        $("#outputFileManagersignature").css("width", "0");
        $("#outputFileManagersignature").css("height", "0");
    });

    $("#clearSignProgrammer").click(function(event) {
        $("#programmer_signature").jSignature("reset");
        $("#fileProgrammersignature").prop("disabled", false);
        $("#programmer_signature").show();
        $("#ticket_programmer_signature").attr("src", "");
        $("#fileProgrammersignature").val("");
        $("#outputFileProgrammersignature").attr("src", "");
        $("#outputFileProgrammersignature").css("width", "0");
        $("#outputFileProgrammersignature").css("height", "0");
    });
}

const toBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });

function addTicketApprove() {
    $("#btn_approve_ticket").click(async function(e) {
        var ticket_start_date = $("#ticket_start_date").val();
        var ticket_severity_id = $("#severity_detail").val();
        var ticket_level_id = $("#level_detail").val();
        console.log(ticket_level_id);
        var ticket_due_date_user = $("#ticket_due_date_user").val();
        var ticket_due_date_manager = $("#ticket_due_date_manager").val();
        var ticket_reject_note = $("#ticket_reject_note").val();
        var programmer = $("#ticket_programmer_selected").select2("data");
        var ticket_type_id = $("#ticket_type_selected").val();
        var ticket_category_id = $("#ticket_category_selected").val();
        var ticket_department_id = $("#ticket_department_selected").val();
        var ticket_no = $("#ticket_no").val();
        var ticket_disapprove_remark_user = $("#approver_disapprovet_note").val();
        var duedate_remark = "";
        var fileDueDateValue = null;
        var fileDueDateTypeValue = null;
        var fileDueDateNameValue = null;
        var ticket_programmer = "";
        var update_dev = "";
        var ticket_rating = "";

        if ($("#custom_due_date").is(":checked")) {
            duedate_remark = $("#duedate_remark").val();
            fileDueDateValue = await getAttach(attachChangeDueDateFile);
            fileDueDateTypeValue = await getAttachType(attachChangeDueDateFile);
            fileDueDateNameValue = await getAttachFileName(attachChangeDueDateFile);
        }

        for (let i = 0; i < programmer.length; i++) {
            ticket_programmer += programmer[i].id;
            if (i != programmer.length - 1) {
                ticket_programmer += ",";
            }
        }

        let status_id = 1;
        var ticket_id = getUrlParameter("ticket_id");
        var msg = "";
        var fileValue = null;
        var fileTypeValue = null;
        var fileNameValue = null;

        if (
            $("#Approve").is(":checked") ||
            $("#Disapprove").is(":checked") ||
            $("#Reject").is(":checked")
        ) {
            if ($("#Approve").is(":checked")) {
                status_id = 2;
                msg = "Yes, approve ticket!";
            } else if ($("#Disapprove").is(":checked")) {
                status_id = 7;
                msg = "Yes, disapprove ticket!";
                fileValue = await getAttach(attachDisapproverFile);
                fileTypeValue = await getAttachType(attachDisapproverFile);
                fileNameValue = await getAttachFileName(attachDisapproverFile);
                ticket_severity_id = "";
            } else if ($("#Reject").is(":checked")) {
                status_id = 9;
                msg = "Yes, reject ticket!";
                fileValue = await getAttach(attachRejectFile);
                fileTypeValue = await getAttachType(attachRejectFile);
                fileNameValue = await getAttachFileName(attachRejectFile);
                ticket_severity_id = "";
            }

            // get the element where the signature have been put
            var msg2 = "";
            var $sigdiv = $("#manager_signature");
            if ($sigdiv.jSignature("getData", "native").length == 0) {
                var file = $("#fileManagersignature").get(0).files[0];
                if (file) {
                    var filesignuser = await toBase64(file);
                } else {
                    var filesignuser = "";
                }
                //console.log(filesignuser)
            }

            if (
                (!ticket_start_date && status_id == 2) ||
                (!ticket_due_date_manager && status_id == 2) ||
                (programmer.length == 0 && status_id == 2) ||
                ($sigdiv.jSignature("getData", "native").length == 0 &&
                    !filesignuser) ||
                (ticket_severity_id == null && status_id == 2) ||
                (ticket_disapprove_remark_user == "" && status_id == 7) ||
                (ticket_reject_note == "" && status_id == 9) ||
                (!ticket_type_id && status_id == 2) ||
                (!ticket_category_id && status_id == 2) ||
                (!ticket_level_id && status_id == 2)
            ) {
                if (!ticket_start_date && status_id == 2) {
                    msg2 = "Ticket start date";
                } else if (!ticket_due_date_manager && status_id == 2) {
                    msg2 = "Ticket due date";
                } else if (programmer.length == 0 && status_id == 2) {
                    msg2 = "Operator";
                } else if (
                    $sigdiv.jSignature("getData", "native").length == 0 &&
                    !filesignuser
                ) {
                    msg2 = "Signature";
                } else if (!ticket_severity_id && status_id == 2) {
                    msg2 = "Severity";
                } else if (!ticket_level_id && status_id == 2) {
                    msg2 = "Level";
                } else if (ticket_disapprove_remark_user == "" && status_id == 7) {
                    msg2 = "Disapprove Note";
                } else if (ticket_reject_note == "" && status_id == 9) {
                    msg2 = "Reject Note";
                } else if (!ticket_type_id && status_id == 2) {
                    msg2 = "Ticket type";
                } else if (!ticket_category_id && status_id == 2) {
                    msg2 = "Ticket category";
                }

                Swal.fire({
                    icon: "warning",
                    title: "Warning!",
                    text: "Please enter " + msg2,
                });
            } else {
                if ($sigdiv.jSignature("getData", "native").length != 0) {
                    // get a base64 URL for a SVG picture
                    var data_signature = $sigdiv.jSignature("getData");
                } else {
                    var data_signature = filesignuser;
                }

                //console.log(ticket_start_date,ticket_due_date_manager,ticket_programmer,status_id,data_signature)

                Swal.fire({
                    title: "Are you sure?",
                    text: "You won't be able to revert this!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#04AA6D",
                    cancelButtonColor: "#d9534f",
                    confirmButtonText: msg,
                }).then((result) => {
                    if (result.isConfirmed) {
                        $(".loader").show();
                        $("#btn_approve_ticket").prop("disabled", true);
                        axios
                            .post("/api/updateApproveTicket", {
                                ticket_id: ticket_id,
                                ticket_start_date: ticket_start_date,
                                ticket_due_date_manager: ticket_due_date_manager,
                                ticket_programmer: ticket_programmer,
                                status_id: status_id,
                                data_signature: data_signature,
                                ticket_severity_id: ticket_severity_id,
                                ticket_level_id: ticket_level_id,
                                ticket_type_id: ticket_type_id,
                                ticket_category_id: ticket_category_id,
                                reject_remark: ticket_reject_note,
                                ticket_department_id: ticket_department_id,
                                ticket_attachment: fileValue,
                                fileNameValue: fileNameValue,
                                fileAttachType: fileTypeValue,
                                ticket_no: ticket_no,
                                ticket_disapprove_note: ticket_disapprove_remark_user,
                                duedate_remark: duedate_remark,
                                ticket_duedate_attachment: fileDueDateValue,
                                fileDueDateName: fileDueDateNameValue,
                                fileDueDateType: fileDueDateTypeValue,
                            })
                            // .then(response => addSuccess())
                            .then((response) => {
                                addSuccess();
                                $("#btn_approve_ticket").prop("disabled", false);
                                lineNotify(
                                    response.data.ticket_no,
                                    response.data.ticket_name,
                                    status_id,
                                    response.data.user_firstname,
                                    response.data.user_lastname,
                                    response.data.user_email,
                                    response.data.dev_name,
                                    update_dev,
                                    ticket_rating,
                                    response.data.ticket_start_date,
                                    "",
                                    status_id == 2 ?
                                    response.data.due_date_manager :
                                    ticket_due_date_user
                                );
                            })
                            .catch((err) => {
                                $(".loader").hide();
                                $("#btn_approve_ticket").prop("disabled", false);
                                Swal.fire({
                                    icon: "error",
                                    title: "Oops...",
                                    text: err,
                                });
                            });
                    }
                });
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please select Approve/Disapprove/Reject",
            });
        }
    });
}

function addTicketConfirm() {
    $("#btn_confirm_ticket").click(async function(e) {
        let status_id = 3;
        var ticket_id = getUrlParameter("ticket_id");
        var update_dev = "";
        var ticket_rating = "";
        var ticket_department_id = $("#ticket_department_selected").val();

        // get the element where the signature have been put
        var $sigdiv = $("#programmer_signature");
        if ($sigdiv.jSignature("getData", "native").length == 0) {
            var file = $("#fileProgrammersignature").get(0).files[0];
            if (file) {
                var filesigndev = await toBase64(file);
            } else {
                var filesigndev = "";
            }
            //console.log(filesigndev)
        }
        if ($sigdiv.jSignature("getData", "native").length == 0 && !filesigndev) {
            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please enter signature",
            });
        } else {
            if ($sigdiv.jSignature("getData", "native").length != 0) {
                // get a base64 URL for a SVG picture
                var data_signature = $sigdiv.jSignature("getData");
            } else {
                var data_signature = filesigndev;
            }

            //console.log(status_id,ticket_id,data_signature);

            Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#04AA6D",
                cancelButtonColor: "#d9534f",
                confirmButtonText: "Yes, confirm ticket!",
            }).then((result) => {
                if (result.isConfirmed) {
                    $(".loader").show();
                    $("#btn_confirm_ticket").prop("disabled", true);
                    axios
                        .post("/api/updateConfirmTicket", {
                            ticket_id: ticket_id,
                            status_id: status_id,
                            data_signature: data_signature,
                            ticket_department_id: ticket_department_id,
                        })
                        .then((response) => {
                            addSuccess();
                            $("#btn_confirm_ticket").prop("disabled", true);
                            lineNotify(
                                response.data.ticket_no,
                                response.data.ticket_name,
                                status_id,
                                response.data.user_firstname,
                                response.data.user_lastname,
                                response.data.user_email,
                                response.data.dev_name,
                                update_dev,
                                ticket_rating,
                                response.data.ticket_start_date,
                                "",
                                response.data.due_date_manager
                            );
                        })
                        .catch((err) => {
                            $(".loader").hide();
                            $("#btn_confirm_ticket").prop("disabled", true);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: err,
                            });
                        });
                }
            });
        }
    });
}

function addTicketChangeDuedate() {
    $("#btn_change_duedate").on("click", async function(e) {
        let isError = false;
        var ticket_id = getUrlParameter("ticket_id");
        var ticket_department_id = $("#ticket_department_selected").val();

        const inputs = document.querySelectorAll('input[name="input[]"]');
        const task_activitys = Array.from(inputs).map((input) => input.value);

        const tasks = task_activitys.filter((item) => item.trim() !== "");
        const ticket_due_date_manager = $("#ticket_due_date_manager").val();
        const status_id = parseInt($("#status_ticket").val());;

        const ticket_no = $("#ticket_no").val();
        const duedate_remark = $("#duedate_remark").val();

        const fileDueDate = await getAttach(attachChangeDueDateFile);
        const fileDueDateType = await getAttachType(attachChangeDueDateFile);

        const fileDueDateName = await getAttachFileName(attachChangeDueDateFile);
        console.log(duedate_remark);

        if (duedate_remark.trim() === "") {
            msg2 = "Change Due Date Remark";
            isError = true;
        }
        console.log(isError);

        if (isError) {
            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please enter " + msg2,
            });
        } else {
            Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#04AA6D",
                cancelButtonColor: "#d9534f",
                confirmButtonText: "Yes, update due date!",
            }).then((result) => {
                if (result.isConfirmed) {
                    $(".loader").show();
                    $("#btn_change_duedate").prop("disabled", true);
                    axios
                        .post("/api/updateDueDate", {
                            ticket_id,
                            ticket_department_id,
                            task_activitys: tasks,
                            ticket_due_date_manager,
                            ticket_no,
                            duedate_remark,
                            fileDueDate,
                            fileDueDateName,
                            fileDueDateType,
                            status_id
                        })
                        .then((response) => {
                            addSuccess();
                            $("#btn_change_duedate").prop("disabled", true);
                            lineNotify(
                                response.data.ticket_no,
                                response.data.ticket_name,
                                status_id,
                                response.data.user_firstname,
                                response.data.user_lastname,
                                response.data.user_email,
                                response.data.dev_name,
                                "",
                                "",
                                response.data.ticket_start_date,
                                "",
                                response.data.due_date_manager
                            );
                        })
                        .catch((err) => {
                            $(".loader").hide();
                            $("#btn_change_duedate").prop("disabled", true);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: err,
                            });
                        });
                }
            });
        }
    });
}

function addTicketApproveConfirm() {
    $("#btn_approve_confirm").click(async function(e) {
        var ticket_start_date = $("#ticket_start_date").val();
        var ticket_severity_id = $("#severity_detail").val();
        var ticket_level_id = $("#level_detail").val();
        var ticket_due_date_manager = $("#ticket_due_date_manager").val();
        var ticket_reject_note = $("#ticket_reject_note").val();
        var programmer = $("#ticket_programmer_selected").select2("data");
        var ticket_type_id = $("#ticket_type_selected").val();
        var ticket_category_id = $("#ticket_category_selected").val();
        var ticket_department_id = $("#ticket_department_selected").val();
        var ticket_no = $("#ticket_no").val();
        var ticket_disapprove_remark_user = $("#approver_disapprovet_note").val();
        var duedate_remark = "";
        var fileDueDateValue = null;
        var fileDueDateTypeValue = null;
        var fileDueDateNameValue = null;

        if ($("#custom_due_date").is(":checked")) {
            duedate_remark = $("#duedate_remark").val();
            fileDueDateValue = await getAttach(attachChangeDueDateFile);
            fileDueDateTypeValue = await getAttachType(attachChangeDueDateFile);
            fileDueDateNameValue = await getAttachFileName(attachChangeDueDateFile);
        }

        var ticket_programmer = "";
        var update_dev = "";
        var ticket_rating = "";
        for (let i = 0; i < programmer.length; i++) {
            ticket_programmer += programmer[i].id;
            if (i != programmer.length - 1) {
                ticket_programmer += ",";
            }
        }

        const inputs = document.querySelectorAll('input[name="input[]"]');
        const task_activitys = Array.from(inputs).map((input) => input.value);

        const tasks = task_activitys.filter((item) => item.trim() !== "");

        let status_id = 3;
        var ticket_id = getUrlParameter("ticket_id");
        var msg = "";
        // get the element where the signature have been put
        var msg2 = "";
        var $sigdiv = $("#manager_signature");
        if ($sigdiv.jSignature("getData", "native").length == 0) {
            var file = $("#fileManagersignature").get(0).files[0];
            if (file) {
                var filesignmanager = await toBase64(file);
            } else {
                var filesignmanager = "";
            }
            // console.log(filesignmanager)
        }

        var $sigdivdev = $("#programmer_signature");
        if ($sigdivdev.jSignature("getData", "native").length == 0) {
            var file_dev = $("#fileProgrammersignature").get(0).files[0];
            if (file_dev) {
                var filesigndev = await toBase64(file_dev);
            } else {
                var filesigndev = "";
            }
            // console.log(filesigndev)
        }

        if (
            (!ticket_start_date && status_id == 3) ||
            (!ticket_due_date_manager && status_id == 3) ||
            (programmer.length == 0 && status_id == 3) ||
            ($sigdiv.jSignature("getData", "native").length == 0 &&
                !filesignmanager) ||
            ($sigdivdev.jSignature("getData", "native").length == 0 &&
                !filesigndev) ||
            (!ticket_severity_id && status_id == 3) ||
            (!ticket_type_id && status_id == 3) ||
            (!ticket_category_id && status_id == 3) ||
            (!ticket_level_id && status_id == 3)
        ) {
            if (!ticket_start_date && status_id == 3) {
                msg2 = "Ticket start date";
            } else if (!ticket_due_date_manager && status_id == 3) {
                msg2 = "Ticket due date";
            } else if (programmer.length == 0 && status_id == 3) {
                msg2 = "Operator";
            } else if (
                ($sigdiv.jSignature("getData", "native").length == 0 &&
                    !filesignmanager) ||
                ($sigdivdev.jSignature("getData", "native").length == 0 && !filesigndev)
            ) {
                msg2 = "Signature";
            } else if (!ticket_severity_id && status_id == 3) {
                msg2 = "Severity";
            } else if (!ticket_level_id && status_id == 3) {
                msg2 = "Level";
            } else if (!ticket_type_id && status_id == 3) {
                msg2 = "Ticket type";
            } else if (!ticket_category_id && status_id == 3) {
                msg2 = "Ticket category";
            }

            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please enter " + msg2,
            });
        } else if (tasks.length == 0) {
            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please enter task activity",
            });
        } else {
            if ($sigdiv.jSignature("getData", "native").length != 0) {
                // get a base64 URL for a SVG picture
                var data_signature = $sigdiv.jSignature("getData");
            } else {
                data_signature = filesignmanager;
            }
            if ($sigdivdev.jSignature("getData", "native").length != 0) {
                // get a base64 URL for a SVG picture
                var data_signature_dev = $sigdivdev.jSignature("getData");
            } else {
                data_signature_dev = filesigndev;
            }

            console.log(
                ticket_start_date,
                ticket_due_date_manager,
                ticket_programmer,
                status_id,
                data_signature,
                data_signature_dev
            );

            Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#04AA6D",
                cancelButtonColor: "#d9534f",
                confirmButtonText: "Yes, confirm ticket!",
            }).then((result) => {
                if (result.isConfirmed) {
                    $(".loader").show();
                    $("#btn_approve_confirm").prop("disabled", true);
                    axios
                        .post("/api/updateApproveConfirm", {
                            ticket_id: ticket_id,
                            ticket_start_date: ticket_start_date,
                            ticket_due_date_manager: ticket_due_date_manager,
                            ticket_programmer: ticket_programmer,
                            status_id: status_id,
                            data_signature: data_signature,
                            data_signature_dev: data_signature_dev,
                            ticket_severity_id: ticket_severity_id,
                            ticket_type_id: ticket_type_id,
                            ticket_category_id: ticket_category_id,
                            ticket_level_id: ticket_level_id,
                            task_activitys: tasks,
                            ticket_department_id: ticket_department_id,
                            ticket_no: ticket_no,
                            duedate_remark: duedate_remark,
                            ticket_duedate_attachment: fileDueDateValue,
                            fileDueDateName: fileDueDateNameValue,
                            fileDueDateType: fileDueDateTypeValue,
                        })
                        // .then(response => addSuccess())
                        .then((response) => {
                            addSuccess();
                            $("#btn_approve_confirm").prop("disabled", false);
                            lineNotify(
                                response.data.ticket_no,
                                response.data.ticket_name,
                                status_id,
                                response.data.user_firstname,
                                response.data.user_lastname,
                                response.data.user_email,
                                response.data.dev_name,
                                update_dev,
                                ticket_rating,
                                response.data.ticket_start_date,
                                "",
                                response.data.due_date_manager
                            );
                        })
                        .catch((err) => {
                            $(".loader").hide();
                            $("#btn_approve_confirm").prop("disabled", false);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: err,
                            });
                        });
                }
            });
        }
    });
}

function addTicketChangedevConfirm() {
    $("#btn_changedev_confirm").click(async function(e) {
        var programmer = $("#ticket_programmer_selected").select2("data");
        var ticket_programmer = "";
        var update_dev = "";
        var ticket_rating = "";
        for (let i = 0; i < programmer.length; i++) {
            ticket_programmer += programmer[i].id;
            if (i != programmer.length - 1) {
                ticket_programmer += ",";
            }
        }

        let status_id = 3;
        var ticket_id = getUrlParameter("ticket_id");
        var ticket_department_id = $("#ticket_department_selected").val();
        var msg = "";
        // get the element where the signature have been put
        var msg2 = "";
        var ticket_sign_manager = $("#ticket_sign_manager").attr("src");
        console.log(ticket_sign_manager);

        var $sigdivdev = $("#programmer_signature");
        if ($sigdivdev.jSignature("getData", "native").length == 0) {
            var file_dev = $("#fileProgrammersignature").get(0).files[0];
            if (file_dev) {
                var filesigndev = await toBase64(file_dev);
            } else {
                var filesigndev = "";
            }
            // console.log(filesigndev)
        }

        if (
            (programmer.length == 0 && status_id == 3) ||
            ($sigdivdev.jSignature("getData", "native").length == 0 && !filesigndev)
        ) {
            if (programmer.length == 0 && status_id == 3) {
                msg2 = "Operator";
            } else if (!ticket_sign_manager ||
                ($sigdivdev.jSignature("getData", "native").length == 0 && !filesigndev)
            ) {
                msg2 = "Signature";
            }

            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please enter " + msg2,
            });
        } else {
            if ($sigdivdev.jSignature("getData", "native").length != 0) {
                // get a base64 URL for a SVG picture
                var data_signature_dev = $sigdivdev.jSignature("getData");
            } else {
                data_signature_dev = filesigndev;
            }

            console.log(ticket_programmer, status_id, data_signature_dev);

            Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#04AA6D",
                cancelButtonColor: "#d9534f",
                confirmButtonText: "Yes, confirm ticket!",
            }).then((result) => {
                if (result.isConfirmed) {
                    $(".loader").show();
                    $("#btn_changedev_confirm").prop("disabled", true);
                    axios
                        .post("/api/updateChangedevConfirm", {
                            ticket_id: ticket_id,
                            ticket_programmer: ticket_programmer,
                            status_id: status_id,
                            data_signature_dev: data_signature_dev,
                            ticket_department_id: ticket_department_id,
                        })
                        // .then(response => addSuccess())
                        .then((response) => {
                            addSuccess();
                            $("#btn_changedev_confirm").prop("disabled", false);
                            lineNotify(
                                response.data.ticket_no,
                                response.data.ticket_name,
                                status_id,
                                response.data.user_firstname,
                                response.data.user_lastname,
                                response.data.user_email,
                                response.data.dev_name,
                                update_dev,
                                ticket_rating,
                                response.data.ticket_start_date,
                                "",
                                response.data.due_date_manager
                            );
                        })
                        .catch((err) => {
                            $(".loader").hide();
                            $("#btn_changedev_confirm").prop("disabled", false);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: err,
                            });
                        });
                }
            });
        }
    });
}

function addTicketAcceptUserReject() {
    $("#btn_accept_user_reject").click(async function(e) {
        var programmer = $("#ticket_programmer_selected").select2("data");
        var ticket_programmer = "";
        var update_dev = "";
        var ticket_rating = "";
        for (let i = 0; i < programmer.length; i++) {
            ticket_programmer += programmer[i].id;
            if (i != programmer.length - 1) {
                ticket_programmer += ",";
            }
        }

        let status_id = 3;
        var ticket_id = getUrlParameter("ticket_id");
        var ticket_department_id = $("#ticket_department_selected").val();

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#04AA6D",
            cancelButtonColor: "#d9534f",
            confirmButtonText: "Yes, update ticket!",
        }).then((result) => {
            if (result.isConfirmed) {
                $(".loader").show();
                $("#btn_accept_user_reject").prop("disabled", true);
                axios
                    .post("/api/updateAcceptUserReject", {
                        ticket_id: ticket_id,
                        ticket_programmer: ticket_programmer,
                        status_id: status_id,
                        ticket_department_id: ticket_department_id,
                    })
                    .then((response) => {
                        addSuccess();
                        $("#btn_accept_user_reject").prop("disabled", false);
                        lineNotify(
                            response.data.ticket_no,
                            response.data.ticket_name,
                            status_id,
                            response.data.user_firstname,
                            response.data.user_lastname,
                            response.data.user_email,
                            response.data.dev_name,
                            update_dev,
                            ticket_rating,
                            response.data.ticket_start_date,
                            "",
                            response.data.due_date_manager
                        );
                    })
                    .catch((err) => {
                        $(".loader").hide();
                        $("#btn_accept_user_reject").prop("disabled", false);
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: err,
                        });
                    });
            }
        });
    });
}

function addTicketComplete() {
    $("#btn_complete_ticket").click(async function(e) {
        // check if task activity is all checked status is 4
        var ticket_department_id = $("#ticket_department_selected").val();
        const taskComplete = false;
        const status_id = taskComplete ? 4 : 3;
        const action_type = "update";
        var ticket_id = getUrlParameter("ticket_id");
        var update_dev = "";
        var ticket_rating = "";

        var fileAttach = "";
        var filetype = "";
        var fileAttachType = "";
        var fileName = "";
        var fileLocalRemove = "";

        if (attachOldFile.length) {
            fileLocalRemove = attachOldFile
                .filter((f) => typeof f === "string" && !attachUpdateFile.includes(f))
                .join(",");
        }

        if (attachFile.length != 0) {
            for (let i = 0; i < attachFile.length; i++) {
                filetype = attachFile[i].name.split(/\.(?=[^\.]+$)/);
                if (i != 0) {
                    fileAttach += "|";
                    fileAttachType += "|";
                    fileName += "|";
                }
                fileAttach += await toBase64(attachFile[i]);
                fileAttachType += filetype[1];
                fileName += filetype[0];
            }

            Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#04AA6D",
                cancelButtonColor: "#d9534f",
                confirmButtonText: "Yes, ticket completed!",
            }).then((result) => {
                if (result.isConfirmed) {
                    $(".loader").show();
                    $("#btn_complete_ticket").prop("disabled", true);
                    axios
                        .post("/api/updateCompleteTicket", {
                            ticket_id: ticket_id,
                            status_id: status_id,
                            ticket_attachment_dev: fileAttach,
                            fileAttachType_dev: fileAttachType,
                            fileName_dev: fileName,
                            action_type: action_type,
                            ticket_department_id: ticket_department_id,
                        })
                        //.then(response => addSuccess())
                        .then((response) => {
                            addSuccess();
                            $("#btn_complete_ticket").prop("disabled", false);
                            lineNotify(
                                response.data.ticket_no,
                                response.data.ticket_name,
                                status_id,
                                response.data.user_firstname,
                                response.data.user_lastname,
                                response.data.user_email,
                                response.data.dev_name,
                                update_dev,
                                ticket_rating,
                                response.data.ticket_start_date,
                                "",
                                response.data.due_date_manager
                            );
                        })
                        .catch((err) => {
                            $(".loader").hide();
                            $("#btn_complete_ticket").prop("disabled", false);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: err,
                            });
                        });
                }
            });
        } else if (attachUpdateFile.length) {
            const newFiles = attachUpdateFile.filter((f) => typeof f === "object");
            const oldFileNames = attachUpdateFile
                .filter((f) => typeof f === "string")
                .join(",");
            for (let i = 0; i < newFiles.length; i++) {
                filetype = newFiles[i].name.split(/\.(?=[^\.]+$)/);
                if (i != 0) {
                    fileAttach += "|";
                    fileAttachType += "|";
                    fileName += "|";
                }
                fileAttach += await toBase64(newFiles[i]);
                fileAttachType += filetype[1];
                fileName += filetype[0];
            }

            Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#04AA6D",
                cancelButtonColor: "#d9534f",
                confirmButtonText: "Yes, ticket completed!",
            }).then((result) => {
                if (result.isConfirmed) {
                    $(".loader").show();
                    $("#btn_complete_ticket").prop("disabled", true);
                    axios
                        .post("/api/updateCompleteTicket", {
                            ticket_id: ticket_id,
                            status_id: status_id,
                            ticket_attachment_dev: fileAttach,
                            fileAttachType_dev: fileAttachType,
                            fileName_dev: fileName,
                            action_type: action_type,
                            fileLocalRemove: fileLocalRemove,
                            oldFileNames: oldFileNames,
                            ticket_department_id: ticket_department_id,
                        })
                        // .then(response => addSuccess())
                        .then((response) => {
                            addSuccess();
                            $("#btn_complete_ticket").prop("disabled", false);
                            lineNotify(
                                response.data.ticket_no,
                                response.data.ticket_name,
                                status_id,
                                response.data.user_firstname,
                                response.data.user_lastname,
                                response.data.user_email,
                                response.data.dev_name,
                                update_dev,
                                ticket_rating,
                                response.data.ticket_start_date,
                                "",
                                response.data.due_date_manager
                            );
                        })
                        .catch((err) => {
                            $(".loader").hide();
                            $("#btn_complete_ticket").prop("disabled", false);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: err,
                            });
                        });
                }
            });
        } else {
            Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#04AA6D",
                cancelButtonColor: "#d9534f",
                confirmButtonText: "Yes, ticket completed!",
            }).then((result) => {
                if (result.isConfirmed) {
                    $(".loader").show();
                    $("#btn_complete_ticket").prop("disabled", true);
                    axios
                        .post("/api/updateCompleteTicket", {
                            ticket_id: ticket_id,
                            status_id: status_id,
                            ticket_attachment_dev: null,
                            fileAttachType_dev: null,
                            action_type: action_type,
                            fileLocalRemove: fileLocalRemove,
                            ticket_department_id: ticket_department_id,
                        })
                        // .then(response => addSuccess())
                        .then((response) => {
                            addSuccess();
                            $("#btn_complete_ticket").prop("disabled", false);
                            lineNotify(
                                response.data.ticket_no,
                                response.data.ticket_name,
                                status_id,
                                response.data.user_firstname,
                                response.data.user_lastname,
                                response.data.user_email,
                                response.data.dev_name,
                                update_dev,
                                ticket_rating,
                                response.data.ticket_start_date,
                                "",
                                response.data.due_date_manager
                            );
                        })
                        .catch((err) => {
                            $(".loader").hide();
                            $("#btn_complete_ticket").prop("disabled", false);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: err,
                            });
                        });
                }
            });
        }
    });
}

function addTicketApprove2() {
    var $selectAll = $("input:radio[name=inlineRadioOptions2]");
    var user_type = $("#user_type").val();
    $selectAll.on("change", function() {
        if ($(this).val() == "Approve" && (user_type == 3 || user_type == 4)) {
            status_id = 6;
            $("#textarea_note_disapprove").hide();
            $("#label_ticket_attachment_disapprove").hide();
            var rating_score = $(".scoreNow").html("0");
            $("#selected_approve_star_manager").show();
        } else {
            status_id = 5;
            $("#textarea_note_disapprove").show();
            $("#label_ticket_attachment_disapprove").show();
            $("#selected_approve_star_manager").hide();
            var stars = $(".ratingW").find("li");
            stars.removeClass("on");
            var rating_score = $(".scoreNow").html("0");
        }
    });

    $("#btn_approve_ticket2").click(async function(e) {
        let status_id = 4;
        var ticket_id = getUrlParameter("ticket_id");
        var rating_score = $(".scoreNow").html();
        var msg = "";
        var ticket_note = $("#ticket_disapprove_note").val();
        var update_dev = "";
        var ticket_rating = "";
        var ticket_department_id = $("#ticket_department_selected").val();
        var ticket_no = $("#ticket_no").val();
        var fileValue = null;
        var fileTypeValue = null;
        var fileNameValue = null;

        console.log(rating_score);

        if ($("#Approve2").is(":checked") || $("#Disapprove2").is(":checked")) {
            if ($("#Approve2").is(":checked")) {
                status_id = 10;
                msg = "Yes, approve ticket!";
            } else if ($("#Disapprove2").is(":checked")) {
                status_id = 5;
                msg = "Yes, disapprove ticket!";
                fileValue = await getAttach(attachDisapproverFile);
                fileTypeValue = await getAttachType(attachDisapproverFile);
                fileNameValue = await getAttachFileName(attachDisapproverFile);
            }
            if (status_id == 10 && rating_score == 0) {
                Swal.fire({
                    icon: "warning",
                    title: "Warning!",
                    text: "Please enter performance rating",
                });
            } else {
                Swal.fire({
                    title: "Are you sure?",
                    text: "You won't be able to revert this!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#04AA6D",
                    cancelButtonColor: "#d9534f",
                    confirmButtonText: msg,
                }).then((result) => {
                    if (result.isConfirmed) {
                        $(".loader").show();
                        $("#btn_approve_ticket2").prop("disabled", true);
                        axios
                            .post("/api/updateApproveTicket2", {
                                ticket_id: ticket_id,
                                status_id: status_id,
                                rating_score: rating_score,
                                ticket_note: ticket_note,
                                ticket_department_id: ticket_department_id,
                                ticket_no: ticket_no,
                                ticket_attachment: fileValue,
                                fileNameValue: fileNameValue,
                                fileAttachType: fileTypeValue,
                            })
                            //.then(response => addSuccess())
                            .then((response) => {
                                addSuccess();
                                $("#btn_approve_ticket2").prop("disabled", false);
                                lineNotify(
                                    response.data.ticket_no,
                                    response.data.ticket_name,
                                    status_id,
                                    response.data.user_firstname,
                                    response.data.user_lastname,
                                    response.data.user_email,
                                    response.data.dev_name,
                                    update_dev,
                                    ticket_rating,
                                    response.data.ticket_start_date,
                                    response.data.ticket_end_date,
                                    response.data.due_date_manager
                                );
                            })
                            .catch((err) => {
                                $(".loader").hide();
                                $("#btn_approve_ticket2").prop("disabled", false);
                                Swal.fire({
                                    icon: "error",
                                    title: "Oops...",
                                    text: err,
                                });
                            });
                    }
                });
            }

            //console.log(status_id,ticket_id,rating_score,ticket_note);
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please select Approve/Disapprove",
            });
        }
    });
}

function addTicketSuccess() {
    $("#btn_success").click(function(e) {
        let status_id = 6;
        var ticket_id = getUrlParameter("ticket_id");
        var rating_score = $(".scoreNow").html();
        var ticket_note = "";
        var update_dev = "";
        var ticket_rating = "";
        var ticket_department_id = $("#ticket_department_selected").val();

        console.log(rating_score);

        if (rating_score != 0) {
            Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#04AA6D",
                cancelButtonColor: "#d9534f",
                confirmButtonText: "Yes, approve ticket!",
            }).then((result) => {
                if (result.isConfirmed) {
                    $(".loader").show();
                    $("#btn_success").prop("disabled", true);
                    axios
                        .post("/api/updateApproveTicket2", {
                            ticket_id: ticket_id,
                            status_id: status_id,
                            rating_score: rating_score,
                            ticket_note: ticket_note,
                            ticket_department_id: ticket_department_id,
                        })
                        // .then(response => addSuccess())
                        .then((response) => {
                            addSuccess();
                            $("#btn_success").prop("disabled", false);
                            lineNotify(
                                response.data.ticket_no,
                                response.data.ticket_name,
                                status_id,
                                response.data.user_firstname,
                                response.data.user_lastname,
                                response.data.user_email,
                                response.data.dev_name,
                                update_dev,
                                ticket_rating,
                                response.data.ticket_start_date,
                                response.data.ticket_end_date,
                                response.data.due_date_manager
                            );
                        })
                        .catch((err) => {
                            $(".loader").hide();
                            $("#btn_success").prop("disabled", false);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: err,
                            });
                        });
                }
            });
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please enter performance rating",
            });
        }
    });
}

function reviseTicket() {
    $("#btn_revise_ticket").click(function(e) {
        let status_id = 3;
        let action_type = "revise";
        var ticket_id = getUrlParameter("ticket_id");
        var update_dev = "";
        var ticket_rating = "";
        var ticket_department_id = $("#ticket_department_selected").val();
        //console.log(status_id,ticket_id);
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#04AA6D",
            cancelButtonColor: "#d9534f",
            confirmButtonText: "Yes, revise ticket!",
        }).then((result) => {
            if (result.isConfirmed) {
                $(".loader").show();
                $("#btn_revise_ticket").prop("disabled", true);
                axios
                    .post("/api/updateCompleteTicket", {
                        ticket_id: ticket_id,
                        status_id: status_id,
                        action_type: action_type,
                        ticket_department_id: ticket_department_id,
                    })
                    //.then(response => addSuccess())
                    .then((response) => {
                        addSuccess();
                        $("#btn_revise_ticket").prop("disabled", false);
                        lineNotify(
                            response.data.ticket_no,
                            response.data.ticket_name,
                            status_id,
                            response.data.user_firstname,
                            response.data.user_lastname,
                            response.data.user_email,
                            response.data.dev_name,
                            update_dev,
                            ticket_rating,
                            response.data.ticket_start_date,
                            "",
                            response.data.due_date_manager
                        );
                    })
                    .catch((err) => {
                        $(".loader").hide();
                        $("#btn_revise_ticket").prop("disabled", false);
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: err,
                        });
                    });
            }
        });
    });
}

function addRatingUser() {
    $("#btn_rating_user").click(function(e) {
        var ticket_id = getUrlParameter("ticket_id");
        var ticket_department_id = $("#ticket_department_selected").val();
        var rating_score = $(".scoreNow2").html();
        var update_dev = "";
        var status_id = 6;
        if (rating_score == 0) {
            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please enter satisfaction rating",
            });
        } else {
            //console.log(rating_score,ticket_id);
            Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#04AA6D",
                cancelButtonColor: "#d9534f",
                confirmButtonText: "Yes, add satisfaction rating!",
            }).then((result) => {
                if (result.isConfirmed) {
                    $(".loader").show();
                    $("#btn_rating_user").prop("disabled", true);
                    axios
                        .post("/api/updateRatingUser", {
                            ticket_id: ticket_id,
                            rating_score: rating_score,
                            ticket_department_id: ticket_department_id,
                        })
                        // .then(response => addSuccess())
                        .then((response) => {
                            addSuccess();
                            $("#btn_rating_user").prop("disabled", false);
                            lineNotify(
                                response.data.ticket_no,
                                response.data.ticket_name,
                                status_id,
                                response.data.user_firstname,
                                response.data.user_lastname,
                                response.data.user_email,
                                response.data.dev_name,
                                update_dev,
                                response.data.ticket_rating,
                                response.data.ticket_start_date,
                                response.data.ticket_end_date,
                                response.data.due_date_manager
                            );
                        })
                        .catch((err) => {
                            $(".loader").hide();
                            $("#btn_rating_user").prop("disabled", false);
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: err,
                            });
                        });
                }
            });
        }
    });
}

function addRatingSuccess() {
    Swal.fire({
        title: "Success!",
        text: "Your satisfaction rating has been added.",
        icon: "success",
        didOpen: () => {
            Swal;
        },
    }).then(function() {
        window.location.href = "/dashboardUser";
    });
}

function lineNotify(
    ticket_no,
    ticket_name,
    status_id,
    user_firstname,
    user_lastname,
    user_email,
    dev_name,
    update_dev,
    ticket_rating,
    ticket_start_date,
    ticket_end_date,
    due_date_manager
) {
    // console.log(ticket_no, ticket_name, status_id, user_firstname, user_lastname, user_email, dev_name, update_dev, ticket_rating, ticket_start_date, ticket_end_date, due_date_manager)
    axios
        .post("/api/LineNotify", {
            status_id: status_id,
            ticket_no: ticket_no,
            user_first_name: user_firstname,
            user_last_name: user_lastname,
            user_email: user_email,
            ticket_name: ticket_name,
            dev_name: dev_name,
            update_dev: update_dev,
            ticket_rating: ticket_rating,
            ticket_start_date: ticket_start_date,
            ticket_end_date: ticket_end_date,
            ticket_due_date: due_date_manager,
        })
        .then((response) => {})
        // .then(response => addSuccess())
        .catch((err) =>
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err,
            })
        );
}

function addSuccess() {
    $(".loader").hide();
    Swal.fire({
        title: "Success!",
        text: "Your ticket has been updated.",
        icon: "success",
    }).then(function() {
        window.location.href = "/dashboardApprover";
    });
}

function changeDev() {
    $("#btn_edit_dev").click(function(e) {
        // console.log(devDB);
        var ticket_id = getUrlParameter("ticket_id");
        var programmer = $("#ticket_programmer_selected").select2("data");
        var update_dev = 1;
        var ticket_rating = "";
        // console.log(programmer);
        var ticket_programmer = "";
        if (programmer.length != 0) {
            if (devDB.length == programmer.length) {
                let dup = 0;
                for (let i = 0; i < devDB.length; i++) {
                    if (devDB[i] == programmer[i].id) {
                        dup = dup + 1;
                    }
                }

                if (dup == devDB.length) {
                    Swal.fire({
                        icon: "warning",
                        title: "Warning!",
                        text: "No programmer changes",
                    });
                } else {
                    changeDev2(
                        ticket_id,
                        programmer,
                        update_dev,
                        ticket_rating,
                        ticket_programmer
                    );
                }
            } else {
                changeDev2(
                    ticket_id,
                    programmer,
                    update_dev,
                    ticket_rating,
                    ticket_programmer
                );
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning!",
                text: "Please select operator",
            });
        }
    });
}

function changeDev2(
    ticket_id,
    programmer,
    update_dev,
    ticket_rating,
    ticket_programmer
) {
    var ticket_department_id = $("#ticket_department_selected").val();
    for (let i = 0; i < programmer.length; i++) {
        ticket_programmer += programmer[i].id;
        if (i != programmer.length - 1) {
            ticket_programmer += ",";
        }
    }

    let status_id = 2;
    //console.log(ticket_programmer,status_id);

    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, change Operator!",
    }).then((result) => {
        if (result.isConfirmed) {
            $(".loader").show();
            $("#btn_edit_dev").prop("disabled", true);
            axios
                .post("/api/updateDev", {
                    ticket_id: ticket_id,
                    ticket_programmer: ticket_programmer,
                    status_id: status_id,
                    ticket_department_id: ticket_department_id,
                })
                .then((response) => {
                    addSuccess();
                    $("#btn_edit_dev").prop("disabled", false);
                    lineNotify(
                        response.data.ticket_no,
                        response.data.ticket_name,
                        status_id,
                        response.data.user_firstname,
                        response.data.user_lastname,
                        response.data.user_email,
                        response.data.dev_name,
                        update_dev,
                        ticket_rating,
                        response.data.ticket_start_date,
                        "",
                        response.data.due_date_manager
                    );
                })
                .catch((err) => {
                    $(".loader").hide();
                    $("#btn_edit_dev").prop("disabled", false);
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: err,
                    });
                });
        }
    });
}

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split("&"),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split("=");

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ?
                true :
                decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
}

function ratingStar(star) {
    star.click(function() {
        var stars = $(".ratingW").find("li");
        stars.removeClass("on");
        var thisIndex = $(this).parents("li").index();
        for (var i = 0; i <= thisIndex; i++) {
            stars.eq(i).addClass("on");
        }
        putScoreNow(thisIndex + 1);
    });
}

function putScoreNow(i) {
    $(".scoreNow").html(i);
}

function setRating() {
    if ($(".ratingW").length > 0) {
        ratingStar($(".ratingW li a"));
    }
}

///////////////////////////////////////////////////////////

function ratingStarUser(star) {
    star.click(function() {
        var stars = $(".ratingW2").find("li");
        stars.removeClass("on");
        var thisIndex = $(this).parents("li").index();
        for (var i = 0; i <= thisIndex; i++) {
            stars.eq(i).addClass("on");
        }
        putScoreNowUser(thisIndex + 1);
    });
}

function putScoreNowUser(i) {
    $(".scoreNow2").html(i);
}

function setRatingUser() {
    if ($(".ratingW2").length > 0) {
        ratingStarUser($(".ratingW2 li a"));
    }
}