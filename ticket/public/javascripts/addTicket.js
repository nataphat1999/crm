$(document).ready(function () {
  $(".loader").hide();

  var user_name =
    $("#user_first_name").val() + " " + $("#user_last_name").val();
  $("#user_name").html(user_name);

  $("#user_signature").jSignature();

  var dateToday = new Date();

  $("#ticket_estimate_date").datepicker({
    format: "yyyy-mm-dd",
    autoHide: true,
    minDate: dateToday,
    startDate: dateToday,
    todayHighlight: "TRUE",
    autoclose: true,
    showButtonPanel: true,
  });

  getProjectCode();
  addTicket();
  clearSign();
  changeSign();
  changeAttachFile();
  changeTicketCode();
  getDepartment();
});

var attachFile = [];
var attachFileType = "";

function getProjectCode() {
  $("#ticket_project_name").select2({
    placeholder: "Please select project code",
    allowClear: true,
  });

  axios
    .get("/api/getProjectCRM", {})
    .then((response) => setProjectCode(response.data.Result))
    .catch((err) =>
      Swal.fire({
        icon: "error",
        title: "Oops... There is a problem with the Get Project CRM.",
        text: err,
      })
    );
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
  $("#ticket_project_name_other_form").hide();
  $("#ticket_project_name_other_checkbox").on("change", function () {
    var is_checked = $(this).is(":checked");
    if (is_checked) {
      $("#ticket_project_name").val("");
      $("#ticket_project_name").trigger("change");
      $("#ticket_project_name").prop("disabled", true);
      $("#ticket_project_name_other_form").show();
    } else {
      $("#ticket_project_name").prop("disabled", false);
      $("#ticket_project_name_other_form").hide();
    }
  });
}

function changeAttachFile() {
  $("#ticket_attachment").on("change", function (event) {
    $("#files_selected").empty();
    var files = $("#ticket_attachment").get(0).files;
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
        $("#files_selected").append('<ul class="ul_files">');
      }

      var list_files =
        '<li class="li_files' +
        i +
        '" data-index="' +
        i +
        '"><div">' +
        attachFile[i].name +
        '<img class="card-icon" id="bin_files" style="float: right; cursor: pointer;" src="../public/images/icon/bin_files.png" onclick="deletefile(this)" /></div></li>';
      $("#files_selected").append(list_files);

      if (i == attachFile.length - 1) {
        $("#files_selected").append("</ul>");
      }
    }
    event.target.value = null;
  });
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
  console.log(data);

  var ticket_department_selected = document.getElementById(
    "ticket_department_selected"
  );
  for (let i = 0; i < data.length; i++) {
    //console.log(data)
    var department_id = data[i].department_id;
    var department_name = data[i].department_name;
    var department_code = data[i].department_code;
    var opt = document.createElement("option");
    opt.value = department_id + "_" + department_code;
    opt.innerHTML = department_name;
    ticket_department_selected.appendChild(opt);
  }
}

function deletefile(element) {
  const index = $(element).closest("li").data("index");
  const classList = $(element).closest("li").attr("class");
  $(element).closest("li").remove();
  if (classList.startsWith("li_files")) {
    attachFile.splice(index, 1);
    $('[class^="li_files"]').each(function (i) {
      $(this).attr("data-index", i);
    });
  }
}

function changeSign() {
  $("#user_signature").bind("change", function (e) {
    if ($("#user_signature").jSignature("getData", "native").length != 0) {
      $("#fileUsersignature").prop("disabled", true);
    } else {
      $("#fileUsersignature").prop("disabled", false);
    }
  });

  $("#fileUsersignature").on("change", function () {
    var filesign = $("#fileUsersignature").get(0).files[0];
    if (filesign) {
      $("#user_signature").hide();
      $("#ticket_user_signature").attr(
        "src",
        "../public/images/sign/sign_null.png"
      );
      $("#outputFileUsersignature").css("width", "517");
      $("#outputFileUsersignature").css("height", "129");
    } else {
      $("#user_signature").show();
    }
  });
}

function clearSign() {
  $("#clear").click(function (event) {
    $("#fileUsersignature").prop("disabled", false);
    $("#user_signature").show();
    $("#ticket_user_signature").attr("src", "");
    $("#user_signature").jSignature("reset");
    $("#fileUsersignature").val("");
    $("#outputFileUsersignature").attr("src", "");
    $("#outputFileUsersignature").css("width", "0");
    $("#outputFileUsersignature").css("height", "0");
  });
}

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

function addTicket() {
  $("#btn_add_ticket").click(async function (e) {
    const ticket_department = $("#ticket_department_selected").val();
    const ticket_name = $("#ticket_name").val();
    const ticket_estimate_date = $("#ticket_estimate_date").val();
    var ticket_project_name = $("#ticket_project_name").val();
    const ticket_objective = $("#ticket_objective").val();
    const ticket_description = $("#ticket_description").val();
    var is_checked = $("#ticket_project_name_other_checkbox").is(":checked");

    if (is_checked) {
      ticket_project_name = $("#ticket_project_name_other").val();
    }

    var fileValue = await getAttach(attachFile);
    // console.log(fileValue);
    var fileTypeValue = await getAttachType(attachFile);
    // console.log(fileTypeValue);
    var fileNameValue = await getAttachFileName(attachFile);
    // console.log(fileNameValue);

    // if(attachFile.length != 0){
    //     for(let i=0;i<attachFile.length;i++){
    //         console.log(attachFile[i])
    //         filetype = attachFile[i].name.split(".");
    //         if(i != 0){
    //             fileAttach  += "|"
    //             fileAttachType  += "|"
    //         }
    //         fileAttach  += await toBase64(attachFile[i]);
    //         fileAttachType += filetype[1]

    //         // console.log(fileAttach);
    //         // console.log(filetype);

    //     }
    // }

    // get the element where the signature have been put
    var $sigdiv = $("#user_signature");
    var msg = "";
    if ($sigdiv.jSignature("getData", "native").length == 0) {
      var file = $("#fileUsersignature").get(0).files[0];
      if (file) {
        var filesignuser = await toBase64(file);
      } else {
        var filesignuser = "";
      }
      //console.log(filesignuser)
    }
    if (
      !ticket_department ||
      !ticket_name ||
      !ticket_estimate_date ||
      !ticket_project_name ||
      !ticket_objective ||
      !ticket_description ||
      ($sigdiv.jSignature("getData", "native").length == 0 &&
        filesignuser == "")
    ) {
      if (!ticket_department) {
        msg = "Ticket department";
      } else if (!ticket_name) {
        msg = "Ticket name";
      } else if (!ticket_estimate_date) {
        msg = "Ticket estimate date";
      } else if (!ticket_project_name) {
        msg = "Ticket project code";
      } else if (!ticket_objective) {
        msg = "Ticket objective";
      } else if (!ticket_description) {
        msg = "Ticket description";
      } else if (
        $sigdiv.jSignature("getData", "native").length == 0 &&
        filesignuser == ""
      ) {
        msg = "Signature";
      }

      Swal.fire({
        icon: "warning",
        title: "Warning!",
        text: "Please enter " + msg,
      });
    } else {
      if ($sigdiv.jSignature("getData", "native").length != 0) {
        // get a base64 URL for a SVG picture
        var data_signature = $sigdiv.jSignature("getData");
      } else {
        var data_signature = filesignuser;
      }

      var dept = ticket_department.split("_");
      var dept_id = dept[0];
      var dept_code = dept[1];

      // console.log(dept_id, dept_code)

      //console.log(ticket_name, ticket_estimate_date, ticket_project_name, ticket_objective, ticket_description, data_signature)

      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#04AA6D",
        cancelButtonColor: "#d9534f",
        confirmButtonText: "Yes, create ticket!",
      }).then((result) => {
        if (result.isConfirmed) {
          $(".loader").show();
          $("#btn_add_ticket").prop("disabled", true);
          axios
            .post("/api/addTicket", {
              ticket_name: ticket_name,
              ticket_due_date: ticket_estimate_date,
              ticket_project_code: ticket_project_name,
              ticket_objective: ticket_objective,
              ticket_description: ticket_description,
              ticket_attachment_user: fileValue,
              fileNameValue: fileNameValue,
              fileAttachType: fileTypeValue,
              data_signature: data_signature,
              ticket_department_id: dept_id,
              ticket_department_code: dept_code,
            })
            .then((response) => {
              lineNotify(response.data.data, ticket_name, ticket_estimate_date);
            })
            .catch((err) => {
              $(".loader").hide();
              $(".btn_add_ticket").prop("disabled", false);
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err.response.data.message,
              });
            });
        }
      });
    }
  });
}

function lineNotify(ticket_no, ticket_name, ticket_estimate_date) {
  var status_id = "1";
  var user_first_name = $("#user_first_name").val();
  var user_last_name = $("#user_last_name").val();
  var user_email = $("#user_email").val();

  axios
    .post("/api/LineNotify", {
      status_id: status_id,
      ticket_no: ticket_no,
      user_first_name: user_first_name,
      user_last_name: user_last_name,
      user_email: user_email,
      ticket_name: ticket_name,
      ticket_start_date: "",
      ticket_end_date: "",
      ticket_estimate_date: ticket_estimate_date,
      dev_name: "",
      update_dev: "",
    })
    .then((response) => addSuccess())
    .catch((err) => {
      $(".loader").hide();
      $(".btn_add_ticket").prop("disabled", false);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err,
      });
    });
}

function addSuccess() {
  $(".loader").hide();
  $(".btn_add_ticket").prop("disabled", false);
  Swal.fire({
    title: "Success!",
    text: "Your ticket has been added.",
    icon: "success",
  }).then(function () {
    window.location.href = "/dashboardUser";
  });
}
