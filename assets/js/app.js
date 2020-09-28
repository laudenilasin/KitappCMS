$( document ).ready(async function() {
    console.log('READY'); 
    AWS.config.update({
        accessKeyId: "",
        secretAccessKey: "",
        region: "ap-southeast-1"
    })
    const bucketName = 'kitapp'; // Enter your bucket name
    const bucket = new AWS.S3({
        httpOptions: {timeout: 0},
        params: {
            ACL : 'public-read',
            Bucket: bucketName,
        },
    });
    async function s3(params){
        return new Promise(async (resolve, reject) => { 
          await bucket.putObject(params, async (error, success) => {
            if (success) {
             var signUrlPhoto = await bucket.getSignedUrl( 'getObject', { Key: params.Key }).slice(0, bucket.getSignedUrl('getObject', { Key: params.Key }).indexOf('?'));
             resolve(signUrlPhoto)
            }
            else{
                console.log('ERROR UPLOADING!', error)
            }
          }).on('httpUploadProgress',function(progress) {
            console.log(progress.loaded + " of " + progress.total + " bytes");
            console.log(parseInt((progress.loaded / progress.total) * 100))
            $('.video-progress-bar').css('width', `${parseInt((progress.loaded / progress.total) * 100)}%`)
            $('.pb-video-progress-bar').css('width', `${parseInt((progress.loaded / progress.total) * 100)}%`)
            });
          await setTimeout(() => { }, 1000);
      });
    }
    $('#login_btn').on('click', async function(){
        event.preventDefault();
        console.log('Logging in!')
        console.log('Username :', $('.login-form input[type=email]').val().trim())
        console.log('Email error:',$("#login-email-error").html() )
        if($(".login-form input[type=email] .invalid-feedback").text() == 'Invalid email address'){
            return false
        }
        let authorized = await axios.post('/api/authenticate-user', {
            username : $('.login-form input[type=email]').val().trim(),
            password : $('.login-form input[type=password]').val().trim()
        })
        console.log('Login api res' , authorized.data )
        if(authorized.data.payload == 'authenticated'){
            $('.login-form input[type=email]').removeClass('is-invalid')
            $('.login-form input[type=password]').removeClass('is-invalid')
            setTimeout(function(){ 
                window.location.href = '/welcome';
            }, 500);
            
        }
        else if(authorized.data.payload == 'deactivated'){
            $('.login-form input[type=email]').addClass('is-invalid')
            $('.login-form input[type=password]').addClass('is-invalid')
            $("#login-email-error").text('')
            $('.error-content').text('Sorry, your account is deactivated')
        }
        else{
            $('.login-form input[type=email]').addClass('is-invalid')
            $('.login-form input[type=password]').addClass('is-invalid')
            $("#login-email-error").text('')
            $('.error-content').text('Incorrect email or password')
        }
    })
    $('#logout_btn').on('click', async function(){
        console.log('Logging out!')
        let authorized = await axios.get('/api/signout')
        if(authorized.data.payload == 'success'){
            window.location.href = '/';
        }
    })  
    if(window.location.pathname == '/products'){
        if(localStorage.getItem('newProduct') != null){
            let newProduct = localStorage.getItem('newProduct')
            console.log('x', newProduct.name)
            $('#div_alert_new_product').css('display', '')
            $('#notif_new_product').text(newProduct)
            localStorage.removeItem('newProduct');
            setTimeout(function()
            { $('#div_alert_new_product').css('display', 'none')
            }, 180000);
        }
        else{
            console.log('x')
            $('#div_alert_new_product').css('display', 'none')
        }
        if(localStorage.getItem('editedProduct') != null){
            // window.location.reload()
            let editedProduct = JSON.parse(localStorage.getItem('editedProduct'));
            let product = await axios.post(`/api/product/${editedProduct.id}`)
            editedProduct = product.data.payload
            console.log('asd', editedProduct)
            $('#div_alert_new_product').css('display', '')
            $('#div_alert_new_product').html("Updated successfully  <button type='button' class='close' data-dismiss='alert' aria-label='Close'><span>&times;</span></button>")
            $(`#tr_${editedProduct.id}`).html(`<td>${editedProduct.order}</td>
            <td><img src="${editedProduct.image}"></td>
            <td>${editedProduct.name}</td>
            <td>PHP ${editedProduct.retail.stick_price}</td>
            <td>PHP ${editedProduct.retail.pack_price}</td>
            <td>PHP ${editedProduct.retail.carton_price}</td>
            <td>PHP ${editedProduct.wholesale.stick_price}</td>
            <td>PHP ${editedProduct.wholesale.pack_price}</td>
            <td>PHP ${editedProduct.wholesale.carton_price}</td>
            <td>
              <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-secondary edit-btn" id="${editedProduct.id}"><i class="fas fa-pencil-alt"></i></button>
                <button type="button" class="btn btn-secondary delete-btn" id="${editedProduct.id}" data-toggle="modal" data-target="#deleteproduct"><i class="far fa-trash-alt"></i></button>
              </div>
            </td>`)
            localStorage.removeItem('editedProduct');
            setTimeout(function()
            { $('#div_alert_new_product').css('display', 'none')
            }, 180000);
        }
    }
    $('.deleteProduct').on('click', async function(){
        console.log('Removing product...', $(this).attr('id'))
        var table = $('#products').DataTable();
        if($(this).attr('id').trim()){
            let removeProduct = await axios.patch('/api/disable-product', {
                id : $(this).attr('id').trim(),
                is_enabled : 0,
            })
            if(removeProduct.data.payload == 'updated'){
                table
                .row( $(`#${$(this).attr('id')}`).closest("tr") )
                .remove()
                .draw();
                $('#div_alert_new_product').css('display', '')
                $('#div_alert_new_product').html("Product deleted <button type='button' class='close' data-dismiss='alert' aria-label='Close'><span>&times;</span></button>")
                localStorage.removeItem('deletedProduct');
                $('#deleteproduct').modal('hide')
                setTimeout(function()
                { $('#div_alert_new_product').css('display', 'none')
                }, 180000);
            }
            else{
                swal("API Error", "Something went wrong", "error");
            }
        }
        else{
            swal("Removing product", "Something went wrong", "error");
        }
    })

    $('.cancelProduct').on('click', function(){
        $('#deleteproduct').modal('hide')
    })

    $('#products tbody').on('click','.editProduct', function(){
        window.location.href = '/edit-product';
        console.log('Editing product...', $(this).attr('id'))
        localStorage.setItem('id', $(this).attr('id').trim());
    })

    $("#email_forgot_password").on('keyup', async function() {
        let value = $(this).val()
        setTimeout(async function(){ 
            let validate_email = await axios.post(`/api/email-validator-in-es/${value}`)
            console.log('Response:',validate_email.data.payload)
            if(validate_email.data.payload == true){
                $('#email_forgot_password').removeClass('is-invalid')
                $('#send_reset_link').removeClass('disabled')
            }
            else{
                $('#email_forgot_password').addClass('is-invalid')
                $('#send_reset_link').addClass('disabled')
                if(validate_email.data.payload == 'not_valid_es'){
                    $('#if_forgot_password').text('Email is not registered')
                }
                else{
                    $('#if_forgot_password').text('Invalid email address')
                }
            }
        }, 500);
    });

    $("#user_email_address").on('keyup', async function() {
        $('#user_email_address').removeClass('is-invalid')
        $('#if_user_email_address').text('This is a required field')
        if($(this).val() != $(this).attr('data-saved')){
            let value = $(this).val()
            setTimeout(async function(){ 
                let validate_email = await axios.post(`/api/email-validator-in-es/${value}`)
                console.log('Response:',validate_email.data.payload)
                if(validate_email.data.payload == true){
                    $('#user_email_address').addClass('is-invalid')
                    $('#if_user_email_address').text('You have entered an email address that already exists')
                }
                else if(validate_email.data.payload == false){
                    $('#user_email_address').addClass('is-invalid')
                    $('#if_user_email_address').text('Invalid email address')
                }
                else{
                    $('#user_email_address').removeClass('is-invalid')
                    $('#if_user_email_address').text('This is a required field')
                }
            }, 500);
        }
    });

    $('#send_reset_link').on('click', async function(){
        console.log('Sending link')
        $('#send_reset_link').addClass('disabled')
        let sendLink = await axios.post(`/api/reset-link-email/${$('#email_forgot_password').val().trim()}`)
        if(sendLink.data.message == 'Success'){
            $('#success_send_reset_link').css('display', 'block')
            $('#send_reset_link').removeClass('disabled')
            $('#email_forgot_password').val('')
        }
        else{
            swal('Send email', 'Something went wrong', 'err')
            $('#send_reset_link').removeClass('disabled')
        }
    })

    $('#confirm_password').on('keyup', function(){
        let id = window.location.pathname.split('&')[1].split('=')[1]
        console.log('id', id)
        let new_password = $('#new_password').val().trim();
        let confirm_password = $(this).val().trim();
        setTimeout(async function(){ 
            if(new_password !=confirm_password ){
                $('#confirm_password').removeClass('is-invalid')
                $('#confirm_password').addClass('is-invalid')
                $('.f_confirm_password').text('Password and Confirm Password fields must match.')
            }
            else{
                $('#confirm_password').removeClass('is-invalid')
                $('.f_confirm_password').text('Password must contain a lowercase letter, uppercase letter and number. Min 8 characters.')
            }
        }, 500);
    })

    $('#new_password').on('keyup', function(){
        let new_password = $('#new_password').val().trim();
        let Exp = /((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i;
        console.log(new_password)
        setTimeout(async function(){ 
            if(!new_password.match(Exp) || new_password.length < 8 || !hasUpperCase(new_password) || !hasLowerCase(new_password) ){
                console.log('invalid')
                $('#new_password').addClass('is-invalid')
            }
            else{
                console.log('valid')
                $('#new_password').removeClass('is-invalid')
            }
        }, 500);
    })
    

    $('#reset_password_btn').on('click', async function(){
        $(this).addClass('disabled')
        $('.reset_pass_inputs').prop('readonly', true);
        console.log('Resetting pass...')
        let id = window.location.pathname.split('&')[1].split('=')[1]
        let userData = {
            id,
            password : $('#confirm_password').val().trim()
        }
        let updateUser = await axios.patch('/api/update-user-account', userData)
        if(updateUser.data.payload == 'updated'){
            $('#success_reset_password').css('display', 'block')
            $('.reset_pass_inputs').val('')
        }
        else{
            swal("Error!", "Something went wrong", "error");
        }
    })

    $('#add_user_btn').on('click', async function(){
        window.onbeforeunload = null;
        console.log('Adding user...')
        $('#user-btn-loader').css('display', '')
        $(this).addClass('disabled')
        let requiredFields = ['user_full_name', 'user_email_address', 'user_type']
        let missingFields = [];
        $('.form-control').removeClass('is-invalid')
        $('.image-upload-wrap').removeClass('is-invalid')
        for(let i = 0; i < requiredFields.length; i++){
            if($('#product_image_container').attr('src') == '') {
                console.log('No image')
                missingFields.push(requiredFields[i]);
            }
            else if($(`#${requiredFields[i]}`).val() == ''){ 
                missingFields.push(requiredFields[i]);
            }
        }
        console.log('Missing fields', missingFields)
        if(missingFields.length){
            for(let i = 0; i < missingFields.length; i++){
                $(`#${missingFields[i]}`).addClass('is-invalid')
                if(missingFields[i] == 'user_type'){
                    $(`#${missingFields[i]}`).addClass('is-invalid')
                    $(`#${missingFields[i]}`).selectpicker('refresh')
                }
            }
            $('#user-btn-loader').css('display', 'none')
            $(this).removeClass('disabled')
        }
        else{
            $('#adduser').modal('show')
            let newUser = {
                name : $('#user_full_name').val().trim(),
                email_address : $('#user_email_address').val().trim(),
                type : $('#user_type').val().trim(),
                is_activated : 1,
            }
            console.log('Adding new user : ', newUser)
              if(window.location.pathname == '/add-user'){
                console.log('Adding new user : ', newUser)
                let addUser = await axios.post('/api/add-user', newUser)
                if(addUser.data.payload == 'created'){
                    localStorage.setItem('newUser', JSON.stringify({
                        name : newUser.name,
                        email_address : newUser.email_address
                    }))
                    window.onbeforeunload = null;
                    setTimeout(function(){ 
                        window.location.href = '/manage-users'
                    }, 500);
                    
                }
                else if(addUser.data.payload == 'email_existed'){
                    swal("Oops", "Email address already existed!", "warning");
                    $('#user-btn-loader').css('display', 'none')
                    $(this).removeClass('disabled')
                    $('#adduser').modal('hide')
                }
                else{
                    swal("Error!", "Something went wrong", "error");
                    $('#user-btn-loader').css('display', 'none')
                    $(this).removeClass('disabled')
                    $('#adduser').modal('hide')
                }
              }
              else{
                newUser.id = localStorage.getItem('id');
                delete newUser.is_activated;
                localStorage.removeItem('id');
                let updateUser = await axios.patch('/api/update-user', newUser)
                if(updateUser.data.payload == 'updated'){
                    localStorage.setItem('editedUser', JSON.stringify(newUser));
                    window.onbeforeunload = null;
                    setTimeout(function(){ 
                        window.location.href = '/manage-users'
                    }, 500);
                    
                }
                else{
                    swal("Error!", "Something went wrong", "error");
                    $('#user-btn-loader').css('display', 'none')
                    $(this).removeClass('disabled')
                    $('#adduser').modal('hide')
                }
              }
        }
    });

    if(window.location.pathname == '/manage-users'){
        if(localStorage.getItem('newUser') != null){
            $('#success_new_user').css('display', '')
            $('#success_new_user').html(`<b>${JSON.parse(localStorage.getItem('newUser')).name}</b> -  <b>${JSON.parse(localStorage.getItem('newUser')).email_address}</b> is successfully added! <button type='button' class='close' data-dismiss='alert' aria-label='Close'><span>&times;</span></button>`)
            localStorage.removeItem('newUser');
            setTimeout(function()
            { $('#success_new_user').css('display', 'none')
            }, 180000);
        }
        else{
            console.log('x')
            $('#success_new_user').css('display', 'none')
        }
        if(localStorage.getItem('editedUser') != null){
            let editedUser = JSON.parse(localStorage.getItem('editedUser'));
            let userDetails = await axios.post(`/api/user/${editedUser.id}`)
            console.log(userDetails)
            editedUser = userDetails.data.payload;
            $('#success_new_user').css('display', '')
            $('#success_new_user').html(`Account details of <b>${editedUser.name}</b> is successfully updated! <button type='button' class='close' data-dismiss='alert' aria-label='Close'><span>&times;</span></button>`)
            if(editedUser.is_activated == 1){
                $(`tr_${editedUser.id}`).html(`<td>${editedUser.name}</td>
                <td class="email_address">${editedUser.email_address}</td>
                <td>${editedUser.type}</td>
                <td>
                  <span class="badge badge-success">Active</span>
                </td>
                <td>
                  <button type="button" class="btn btn-secondary-round editUser" id="${editedUser.id}">Edit Details</button>
                  <button type="button" class="btn btn-light-round resetPassword" id="${editedUser.id}&&${editedUser.name}" data-toggle="modal" data-target="#resetpassword">Reset Password</button>
                  <button type="button" class="btn btn-cancel-round deactivate ${editedUser.id}" id="${editedUser.id}&&${editedUser.name}" data-toggle="modal" data-target="#deactivateuser">Deactivate</button>
                </td>`)
            }
            else{
                $(`tr_${editedUser.id}`).html(`<td>${editedUser.name}</td>
                <td class="email_address">${editedUser.email_address}</td>
                <td>${editedUser.type}</td>
                <td>
                <span class="badge badge-secondary">Deactivated</span>
                </td>
                <td>
                <button type="button" class="btn btn-secondary-round editUser" id="${editedUser.id}">Edit Details</button>
                <button type="button" class="btn btn-light-round resetPassword" id="${editedUser.id}&&${editedUser.name}" data-toggle="modal" data-target="#resetpassword">Reset Password</button>
                <button type="button" class="btn btn-success-round activate ${editedUser.id}" id="${editedUser.id}&&${editedUser.name}" data-toggle="modal" data-target="#activateuser">Activate</button>
                </td>`)
            }
            
            localStorage.removeItem('editedUser');
            setTimeout(function()
            { $('#success_new_user').css('display', 'none')
            }, 180000);
            
        }
    }
    if(window.location.pathname == '/edit-user'){
        console.log('Id :', localStorage.getItem('id'))
        let id = localStorage.getItem('id')
        let userDetails = await axios.post(`/api/user/${id}`)
        if(userDetails.data.payload){
            let data = userDetails.data.payload
            if(data.name){
                $('#user_full_name').val(data.name)
            }
            if(data.type){
                $('#user_type').val(data.type);
                $('#user_type').selectpicker('refresh')
            }
            if(data.email_address){
                $('#user_email_address').val(data.email_address);
                $('#user_email_address').attr('data-saved', data.email_address);
            }
        }
    }

    $('#users tbody').on('click', '.editUser', async function(){
        console.log('Edit user');
        localStorage.setItem('id', $(this).attr('id').trim());
        window.location.href = '/edit-user'
    })

    $('#users tbody').on('click','.resetPassword',async function(){
        console.log('Id', $(this).attr('id').trim())
        localStorage.removeItem('userDetails');
        localStorage.setItem('userDetails', $(this).attr('id').trim())
        $('#resetPasswordFullName').text($(this).attr('id').trim().split('&&')[1])
        $('.resetPasswordUser').attr('id', $(this).attr('id').trim().split('&&')[0] )
    })

    $('#users tbody').on('click', '.deactivate', async function(){
        console.log('Id', $(this).attr('id').trim())
        localStorage.removeItem('userDetails');
        localStorage.setItem('userDetails', $(this).attr('id').trim())
        $('#deactivateUserFullName').text($(this).attr('id').trim().split('&&')[1])
        $('.deactivateUser').attr('id', $(this).attr('id') )
    })

    $('.deactivateUser').on('click', async function(){
        console.log('Deactivate user');
        let deactivateUser = await axios.patch('/api/update-user', {
            id : $(this).attr('id').trim().trim().split('&&')[0],
            is_activated : 0,
        })
        if(deactivateUser.data.payload == 'updated'){
            $('#success_new_user').css('display', '')
            $('#success_new_user').html(`User <b>${$(`#${$(this).attr('id').trim().trim().split('&&')[0]}`).closest("tr").find('td:eq(0)').text()}</b> has been deactivated`)
            $('#deactivateuser').modal('hide')
            $(`.${$(this).attr('id').trim().split('&&')[0]}`).closest("tr").find('td:eq(4)').html(`<button type="button" class="btn btn-secondary-round editUser" id="${$(this).attr('id').trim().split('&&')[0]}">Edit Details</button>
            <button type="button" class="btn btn-light-round resetPassword" id="${$(this).attr('id').trim()}" data-toggle="modal" data-target="#resetpassword">Reset Password</button>
            <button type="button" class="btn btn-success-round activate ${$(this).attr('id').trim().split('&&')[0]}" id="${$(this).attr('id').trim()}" data-toggle="modal" data-target="#activateuser">Activate</button>`)
            $(`.${$(this).attr('id').trim().split('&&')[0]}`).closest("tr").find('td:eq(3)').html(`<span class="badge badge-secondary">Deactivated</span>`)
            setTimeout(function(){ 
                $('#success_new_user').css('display', 'none')
                window.location.reload()
            }, 180000);
        }
        else{
            swal('Deactivate user', 'Something went wrong', 'error')
        }
    })

    $('.resetPasswordUser').on('click', async function(){
        console.log('Reset password of user',$(this).closest("tr").find('td:eq(1)').text());
        console.log('Reset password of user',  $(this).attr('id').trim());
        localStorage.setItem('id', $(this).attr('id').trim());
        let resetPass = await axios.patch('/api/reset-password', {
            id : $(this).attr('id').trim(),
            email_address : $(`#${$(this).attr('id').trim()}`).closest("tr").find('td:eq(1)').text().trim()
        })
        if(resetPass.data.payload == 'updated'){
            $('#success_new_user').css('display', '')
            $('#success_new_user').html(`Password has been reset for user <b>${$(`#${$(this).attr('id').trim()}`).closest("tr").find('td:eq(0)').text()}</b>`)
            $('#resetpassword').modal('hide')
            setTimeout(function()
            { $('#success_new_user').css('display', 'none')
            }, 180000);
        }
        else{
            swal('Reset Password', 'Something went wrong', 'error')
        }
    })

    $('.cancelResetPassword').on('click', function(){
        $('#resetpassword').modal('hide')
    })

    $('.cancelDeactivateUser').on('click', function(){
        $('#deactivateuser').modal('hide')
    })

    $('.cancelActivateUser').on('click', function(){
        $('#activateuser').modal('hide')
    })

    $('#users tbody').on('click', '.activate', async function(){
        console.log('Id', $(this).attr('id').trim())
        localStorage.removeItem('userDetails');
        localStorage.setItem('userDetails', $(this).attr('id').trim())
        console.log($(this).attr('id').trim())
        $('#activateUserFullName').text($(this).attr('id').trim().split('&&')[1])
        $('.activateUser').attr('id', $(this).attr('id').trim() )
    })

    $('.activateUser').on('click', async function(){
        console.log('Activate user');
        let activateUser = await axios.patch('/api/update-user', {
            id : $(this).attr('id').trim().split('&&')[0],
            is_activated : 1,
        })
        if(activateUser.data.payload == 'updated'){
            $('#success_new_user').css('display', '')
            $('#success_new_user').html(`User <b>${$(`#${$(this).attr('id').split('&&')[0]}`).closest("tr").find('td:eq(0)').text()}</b> has been activated`)
            $('#activateuser').modal('hide')
            $(`.${$(this).attr('id').trim().split('&&')[0]}`).closest("tr").find('td:eq(4)').html(`<button type="button" class="btn btn-secondary-round editUser" id="${$(this).attr('id').trim().split('&&')[0]}">Edit Details</button>
            <button type="button" class="btn btn-light-round resetPassword" id="${$(this).attr('id').trim()}" data-toggle="modal" data-target="#resetpassword">Reset Password</button>
            <button type="button" class="btn btn-cancel-round deactivate ${$(this).attr('id').trim().split('&&')[0]}" id="${$(this).attr('id').trim()}" data-toggle="modal" data-target="#deactivateuser">Deactivate</button>`)
            $(`.${$(this).attr('id').trim().split('&&')[0]}`).closest("tr").find('td:eq(3)').html(`<span class="badge badge-success">Active</span>`)
            setTimeout(function()
            { $('#success_new_user').css('display', 'none')
            }, 180000);
        }
        else{
            swal('Deactivate user', 'Something went wrong', 'error')
        }
    })

    $('#cp_update_btn').on('click', async function(){
        console.log('Update password');
        let requiredFields = ['cp_password', 'cp_new_password', 'cp_confirm_password']
        let missingFields = [];
        $('.form-control').removeClass('is-invalid')
        $('.image-upload-wrap').removeClass('is-invalid')
        for(let i = 0; i < requiredFields.length; i++){
            if($(`#${requiredFields[i]}`).val() == ''){
                missingFields.push(requiredFields[i])
            }
        }
        console.log('Missing fields', missingFields)
        if(missingFields.length){
            $('.current_password_if').text('This is a required field.')
            $('.confirm_pass_if').text('This is a required field.')
            for(let i = 0; i < missingFields.length; i++){
                $(`#${missingFields[i]}`).addClass('is-invalid')
            }
        }
        else{
            let verify_password = await axios.post('/api/verify-password', { 
                password : $('#cp_password').val().trim()
            })
            console.log('VERIFY_RES', verify_password.data.payload)
            let data = verify_password.data.payload.response
            if(data === 'verified' && $('#cp_new_password').val().trim() === $('#cp_confirm_password').val().trim()){
                $('#changepassword').modal('show');
                $('#cp_password').removeClass('is-invalid')
                $('.current_password_if').text('This is a required field.')
                let updatePass = await axios.patch('/api/update-user-account', {
                    id : verify_password.data.payload.id,
                    password : $('#cp_confirm_password').val().trim()
                })
                if(updatePass.data.payload === 'updated'){
                    $('#success_change_password').css('display', 'block');
                    $('#cp_password').val('')
                    $('#cp_confirm_password').val('')
                    $('#cp_new_password').val('')
                    $('#cp_update_btn').addClass('disabled')
                    $('#cp_cancel_btn').addClass('disabled')
                    setTimeout(function()
                    { $('#success_change_password').css('display', 'none')
                    }, 180000);
                }
                else{
                    swal('Change password', 'Something went wrong', 'error')
                }
                $('#changepassword').removeClass('show');
                $('#changepassword').css('display', 'none');
                $('.modal-backdrop').removeClass('show');
                $('.dashboard ').removeClass('modal-open')
                $('.modal-backdrop').remove();
            }
            else{
                $('#cp_password').addClass('is-invalid')
                $('.current_password_if').text('Incorrect Password')
            }
        }
    })

    $('#cp_cancel_btn').on('click', function(){
        swal({
            text: "Are you sure?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          })
          .then((willDelete) => {
            if (willDelete) {
              $('.cp_inputs').val('')
              $('.cp_inputs').removeClass('is-invalid')
              $('#cp_cancel_btn').addClass('disabled')
              $('#cp_update_btn').addClass('disabled')
            } 
          });
    })

    $('#cp_confirm_password').on('keyup', function(){
        let new_password = $('#cp_new_password').val().trim();
        let confirm_password = $(this).val().trim();
        setTimeout(async function(){ 
            if(new_password !=confirm_password ){
                $('#cp_confirm_password').addClass('is-invalid')
                $('.confirm_pass_if').text('Password and Confirm Password fields must match.')
            }
            else{
                $('#cp_confirm_password').removeClass('is-invalid')
                $('.confirm_pass_if').text('This is a required field.')
            }
        }, 500);
    })

    function hasLowerCase(str) {
        if(str.toUpperCase() != str) {
            return true;
        }
        return false;
    }

    function hasUpperCase(str) {
        if(str.toLowerCase() != str) {
            return true;
        }
        return false;
    }

    $('#cp_new_password').on('keyup', function(){
        let new_password = $('#cp_new_password').val().trim();
        let Exp = /((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i;
        console.log(new_password)
        setTimeout(async function(){ 
            if(!new_password.match(Exp) || new_password.length < 8){
                $('#cp_new_password').addClass('is-invalid')
                $('.new_pass_if').text('Password must contain: lowercase letter, uppercase letter, a number. Minimum 8 Characters')
            }
            else{
                console.log('valid')
                $('#cp_new_password').removeClass('is-invalid')
                $('.new_pass_if').text('This is a required field')
                console.log(hasUpperCase(new_password))
                console.log(hasLowerCase(new_password))
                if(!hasUpperCase(new_password) || !hasLowerCase(new_password) ){
                    console.log('invalid')
                    $('#cp_new_password').addClass('is-invalid')
                    $('.new_pass_if').text('Password must contain: lowercase letter, uppercase letter, a number. Minimum 8 Characters')
                }
            }
        }, 500);
    })

    $('.nav-link').removeClass('active')
    switch(window.location.pathname){
        case '/welcome' : 
        $('#welcome').addClass('active')
        break;
        case '/edit-product' : 
        case '/add-product' : 
        case '/products' : 
        $('#product').addClass('active')
        break;
        case '/messages' : 
        $('#messages').addClass('active')
        break;
        case '/cbf-videos' : 
        $('#cbf-videos').addClass('active')
        break;
        case '/trade-programs' : 
        $('#trade-programs').addClass('active')
        break;
        case '/pssp' : 
        $('#pssp').addClass('active')
        break;
        case '/price-program' : 
        $('#price-program').addClass('active')
        break;
        case '/power-of-brand' : 
        $('#power-of-brand').addClass('active')
        break;
        case '/pages' : 
        $('#pages').addClass('active')
        break;
        case '/add-user' : 
        case '/edit-user' : 
        case '/manage-users' : 
        $('#manage-users').addClass('active')
        break;
        case '/change-password' : 
        $('#change-password').addClass('active')
        break;
    }

    $(".login-page input[type=email]").on('keyup', async function() {
        let value = $(this).val()
        console.log('working', value)
        $("#login-email-error").text('Invalid email address')
        setTimeout(async function(){ 
            let validate_email = await axios.post(`/api/email-validator/${value}`)
            console.log('Response:',validate_email.data.payload)
            if(validate_email.data.payload){
                $('.login-form input[type=email]').removeClass('is-invalid')
                $('#login_btn').removeClass('disabled')
            }
            else{
                $('.login-form input[type=email]').addClass('is-invalid')
                $('#login_btn').addClass('disabled')
            }
        }, 500);
    });

    $("#user_full_name").on('keyup', async function() {
        if($('#user_full_name').val() == '' || $('#user_full_name').val().trim().length == 0){
            $('#user_full_name').addClass('is-invalid')
        }
        else{
            var hasNumber = /\d/;
            if(/^[a-zA-Z0-9_ ]*$/.test($(this).val().trim()) == false || /^\d+$/.test($(this).val().trim()) == true || hasNumber.test($(this).val().trim())){
                $('#user_full_name').addClass('is-invalid')
                $('#if_full_name').text('Full name must not accepts special characters and numbers')
            }
            else{
                $('#user_full_name').removeClass('is-invalid')
                $('#if_full_name').text('This is a required field')
            }
        }
        
    });

    $('.edit-message-btn').on('click', async function(){
        console.log('ID', $(this).attr('id').trim())
        window.location.href = `/messages&action=edit&id=${$(this).attr('id').trim()}`
    })

    $('.edit-message').on('click', async function(){
        $(this).css('display', 'none')
        $('.action-btn-message').css('display', '')
        $('.message-content').removeAttr('disabled')
    })

    $('.update-message').on('click', async function(){
        if(!($('.message-content').val())){
            $('.message-content').addClass('is-invalid')
            $('.message-content_s').removeClass('feedback')
            $('.message-content_s').addClass('invalid-feedback')
            $('.message-content_s').text('This is a required field')
            return;
        }
        $('.message-content_s').removeClass('invalid-feedback')
        $('.message-content_s').addClass('feedback')
        $('.message-content_s').text('Character/s Remaining: 60')
        $('.message-content').removeClass('is-invalid')
        $('.update-message').html('Save <span class="spinner-border spinner-border-sm" role="status"')
        $('.update-message').addClass('disabled')
        $('#updatemessage').modal('show')
        let id = window.location.pathname.split('&')[2].trim().split('=')[1].trim();
        let content = $('.message-content').val().trim()
        console.log('content', content)
        let updateMessage = await axios.patch('/api/update-message', {
            id,
            content,
        })
        if(updateMessage.data.payload === 'updated' || updateMessage.data.payload === 'noop'){
            $('.message-content').attr('disabled', '')
            localStorage.setItem('Updated Message', `${id}&&${content}`)
            window.location.href = '/messages'
        }
        else{
            swal('Edit Message API', 'Something went wrong', 'error')
        }
    })

    if(window.location.pathname == '/messages'){
        if(localStorage.getItem('Updated Message')){
            console.log(localStorage.getItem('Updated Message'))
            console.log(`#${localStorage.getItem('Updated Message').split('&&')[0]}_textarea`)
            $(`#${localStorage.getItem('Updated Message').split('&&')[0]}_textarea`).val( localStorage.getItem('Updated Message').split('&&')[1] )
            $('#success_edit_message').css('display', '')
            setTimeout(function()
            { $('#success_edit_message').css('display', 'none')
            }, 180000);
            localStorage.removeItem('Updated Message')
        }
    }

    $('#edit-cbf-video').on('click', async function(){
        $(this).css('display', 'none')
        $('.action-btn-video').css('display', '')
        $('.file-detail-form').css('display', '')
    })

    $('#update-cbf-video').on('click', async function(){
        let video_url;
        $(this).addClass('disabled')
        $(this).append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
        $('.action-btn-video').css('display', '')
        const fileChooser = $('.video-input')
        const fileName = $('.video-input').val().split('\\')[2];
        console.log(fileChooser)
        var files = fileChooser[0].files[0]
        var filesize = ((files.size/1024)/1024).toFixed(4);
        console.log('filesize', filesize)
        if(filesize >  40){
            console.log('asd')
            $('#cbf_video_validation').css('display', '')
        }
        else if(fileChooser[0].files[0].type != 'video/mp4'){
            console.log('asd')
            $('#cbf_video_validation').css('display', '')
        }
        else{
            $('#updatevideo').modal('show')
            console.log('Validation passed')
            if (fileChooser[0].files[0]) {
                console.log('If filechooser')
                const profilePicture = fileChooser[0].files[0];
                const objKey = `cbf-video/${fileName}_${moment().valueOf()}`;
                const params = {
                Key: objKey,
                ContentType: profilePicture.type,
                Body: profilePicture,
                };
                var sUrl = await s3(params);
                if(sUrl){
                    video_url = sUrl;
                }
            }
            if(video_url){
                let update_video = await axios.post('/api/update-video', {
                    video : video_url,
                    filename : fileName,
                })
                if(update_video.data.payload == 'updated'){
                    setTimeout(function()
                    {   $('#update-cbf-video').html('Update New Video ')
                        $('#update-cbf-video').addClass('disabled')
                        $('#video-container').attr('src', video_url);
                        $('#video-filename').prop('value' , fileName)
                        $('#video-filename-l').html('Choose file')
                        $('#updatevideo').modal('hide')
                        $('#edit-cbf-video').css('display', '')
                        $('.action-btn-video').css('display', 'none')
                        $('.file-detail-form').css('display', 'none')
                        $('#success_video_updated').css('display', '')
                        $('#filename_success').text(fileName)
                    }, 1000);
                    setTimeout(function()
                    { $('#success_video_updated').css('display', 'none')
                    }, 180000);
                }
            }
        }
    })

    $('#cancel-cbf-video').on('click', async function(){
        $('#edit-cbf-video').css('display', '')
        $('.action-btn-video').css('display', 'none')
        $('.file-detail-form').css('display', 'none')
        $('#video-filename-l').html('Choose file')
        $('.video-input').val('')
        $('#update-cbf-video').addClass('disabled')
    })

    $('.video-input').change(function(){
        let input = $(this);
        console.log(input)
        console.log(input[0].files)
        $('#update-cbf-video').addClass('disabled')
        if (input[0].files && input[0].files[0]) {
            var files = input[0].files[0]
            var filesize = ((files.size/1024)/1024).toFixed(4);
            console.log('filesize', filesize)
            if(filesize >  40){
                console.log('asd')
                $('.video-input').addClass('is-invalid')
                $(this).val('')
            }
            else if(input[0].files[0].type != 'video/mp4'){
                console.log('asd',input[0].files[0].type )
                $('.video-input').addClass('is-invalid')
                $(this).val('')
            }
            else{
                $('#update-cbf-video').removeClass('disabled')
                console.log('asd')
                $('.video-input').removeClass('is-invalid')
                var reader = new FileReader();
                reader.onload = function(e) {
                //   $('#video-container').attr('src', e.target.result);
                  $('#video-filename-l').html(input[0].files[0].name);
                };
                reader.readAsDataURL(input[0].files[0]);
            }
          }
    })

    $('#table_first5').on('click', '.btn-edit', async function(){
        console.log('clicked', $(this).attr('data-id'));
        let data = await axios.post('/api/trade-programs', { id : $(this).attr('data-id')})
        console.log(data.data.payload)
        if(Object.keys(data.data.payload).length){
            if(data.data.payload.image){
                data.data.payload.image = {
                    image :  data.data.payload.image,
                    filename : `${data.data.payload.image.split('/')[4].split('.')[0]}.jpg`
                }
            }
            if(data.data.payload.image.image){
                $(this).closest('tr').html(`<td><img src="${data.data.payload.image.image}"></td>
            <td>
            <div class="row">
                <div class="col-md-6" style="width:auto;">
                <input type="text" maxlength="50" value="${data.data.payload.caption}" id="${data.data.payload.id}" class="form-control form-enable" onkeyup="captionKeyup(${data.data.payload.id})" required>
                </div>
                <div class="col-md-6" style="width:auto;">
                <div class="input-group">
                <div class="input-group-prepend">
                    <span class="input-group-text tp_filename" id="inputGroupFileAddon01">Upload Image</span>
                </div>
                <div class="custom-file">
                    <input type="file" class="custom-file-input tp_fileInput" id="${data.data.payload.id}_i" accept="image/jpg, image/png"  id="inputGroupFile01"
                    aria-describedby="inputGroupFileAddon01" required>
                    <label class="custom-file-label" id="${data.data.payload.id}_cfl" style="text-align:left;display:inline-block;text-overflow: clip;overflow: hidden;" for="inputGroupFile01">${data.data.payload.image.filename}</label>
                    </div>
                    <button class="btn btn-danger removeImage"><i class="fas fa-times"></i></button>
                  </div>
                    </div>
                </div>
            </div>
            </div>
            <div class="row programs--badge">
                <div class="col-md-6">
                    <span id="${data.data.payload.id}_s" class="badge badge-danger">Character/s Remaining: ${50-data.data.payload.caption.length}</span>
                </div>
                <div class="col-md-6" id="${data.data.payload.id}file_error">
                    <span class="badge badge-danger">File Format: PNG or JPG | File size: Max of 20 MB</span>
                </div>
            </div>
            </td>
            <td>
                <a type="button" class="btn btn-success-round btn-save tp_buttons disabled" data-id="${$(this).attr('data-id')}"> Save </a>
                <a type="button" class="btn btn-cancel-round btn-cancel" data-id="${$(this).attr('data-id')}">Cancel</a>
            </td>`)
            }
            else{
                $(this).closest('tr').html(`<td><img></td>
            <td>
            <div class="row">
                <div class="col-md-6" style="width:auto;">
                <input type="text" maxlength="50" value="${data.data.payload.caption}" id="${data.data.payload.id}" class="form-control form-enable" onkeyup="captionKeyup(${data.data.payload.id})" required>
                </div>
                <div class="col-md-6" style="width:auto;">
                <div class="input-group">
                <div class="input-group-prepend">
                    <span class="input-group-text tp_filename" id="inputGroupFileAddon01">Upload Image</span>
                </div>
                <div class="custom-file">
                    <input type="file" class="custom-file-input tp_fileInput" id="${data.data.payload.id}_i" accept="image/jpg, image/png" id="inputGroupFile01"
                    aria-describedby="inputGroupFileAddon01" required>
                    <label class="custom-file-label" id="${data.data.payload.id}_cfl" style="text-align:left;display:inline-block;text-overflow: clip;overflow: hidden;" for="inputGroupFile01"></label>
                    </div>
                    <button class="btn btn-danger removeImage"><i class="fas fa-times"></i></button>
                  </div>
                    </div>
                </div>
            </div>
            </div>
            <div class="row programs--badge">
                <div class="col-md-6">
                    <span id="${data.data.payload.id}_s" class="badge badge-danger">Character/s Remaining: ${50-data.data.payload.caption.length}</span>
                </div>
                <div class="col-md-6" id="${data.data.payload.id}file_error">
                    <span class="badge badge-danger">File Format: PNG or JPG | File size: Max of 20 MB</span>
                </div>
            </div>
            </td>
            <td>
                <a type="button" class="btn btn-success-round btn-save tp_buttons disabled" data-id="${$(this).attr('data-id')}"> Save </a>
                <a type="button" class="btn btn-cancel-round btn-cancel" data-id="${$(this).attr('data-id')}">Cancel</a>
            </td>`)
            }
        }
        else{
            $(this).closest('tr').html(`<td><img></td>
            <td>
              <div class="row">
                <div class="col-md-6" style="width:auto;">
                  <input type="text" maxlength="50" placeholder="Image title" id="${$(this).attr('data-id')}" class="form-control form-enable" onkeyup="captionKeyup(${data.data.payload.id})" required>
                </div>
                <div class="col-md-6" style="width:auto;">
                <div class="input-group">
                  <div class="input-group-prepend">
                    <span class="input-group-text tp_filename" id="inputGroupFileAddon01">Upload Image</span>
                  </div>
                  <div class="custom-file">
                    <input type="file" class="custom-file-input tp_fileInput" id="${$(this).attr('data-id')}_i" accept="image/jpg, image/png" id="inputGroupFile01"
                      aria-describedby="inputGroupFileAddon01" required>
                    <label class="custom-file-label" id="${$(this).attr('data-id')}_cfl" style="text-align:left;display:inline-block;text-overflow: clip;overflow: hidden;" for="inputGroupFile01">programs-screen-sample.png</label>
                    </div>
                    <button class="btn btn-danger removeImage"><i class="fas fa-times"></i></button>
                  </div>
                    </div>
                </div>
              </div>
              </div>
              <div class="row programs--badge">
                <div class="col-md-6">
                    <span id="${$(this).attr('data-id')}_s" class="badge badge-danger">Character/s Remaining: ${50}</span>
                </div>
                <div class="col-md-6" id="${$(this).attr('data-id')}file_error">
                    <span class="badge badge-danger">File Format: PNG or JPG | File size: Max of 5 MB</span>
                </div>
            </div>
            </td>
            <td>
                <a type="button" class="btn btn-success-round btn-save tp_buttons disabled" data-id="${$(this).attr('data-id')}"> Save </a>
                <a type="button" class="btn btn-cancel-round btn-cancel" data-id="${$(this).attr('data-id')}">Cancel</a>
            </td>`)
        }
    })

    $('#table_first5').on('click', '.removeImage', async function(){
        console.log('clicked');
        $(this).closest('tr').find('input[type=file]').val('');
        $(this).closest('tr').find('.custom-file-label').text('');
        $(this).closest('tr').find('img').removeAttr('src');
        $(this).closest('tr').find('input').trigger('keyup')
    })
    

    $('#table_first5').on('click', '.btn-cancel', async function(){
        console.log('clicked');
        let data = await axios.post('/api/trade-programs', { id : $(this).attr('data-id')})
        $(this).closest('tr').html(`<td><img src="${data.data.payload.image}"></td>
        <td><input type="text" class="form-control" disabled value="${data.data.payload.caption}"></td>
        <td><button type="button" class="btn btn-secondary-round btn-edit" data-id="${data.data.payload.id}">Edit Image</button></td>`)
    })

    $('#table_first5').on('change', '.tp_fileInput', function(){
        console.log('changed')
        console.log($(this)[0].files[0].name)
        console.log( $(this).nextAll('.custom-file-label').text() )
        $(this).closest('tr').find('.tp_buttons').removeClass('disabled')
        $(this).removeClass('is-invalid')
        $(this).nextAll('.custom-file-label').html($(this)[0].files[0].name)
        var files = $(this)[0].files[0]
        var filesize = ((files.size/1024)/1024).toFixed(4);
        console.log('filesize', filesize)
        if(filesize >  20){
            $(`#${$(this).attr('id').split('_')[0]}file_error`).css('display', '')
            $(this).closest('tr').find('.tp_buttons').addClass('disabled')
            $(this).addClass('is-invalid')
        }
        console.log(files.type)
        if(files.type != 'image/png' && files.type != 'image/jpeg'){
            $(`#${$(this).attr('id').split('_')[0]}file_error`).css('display', '')
            $(this).closest('tr').find('.tp_buttons').addClass('disabled')
            $(this).addClass('is-invalid')
        }
        if($(this).closest('tr').find('input[type=text]').val() == '' || $(this).closest('tr').find('input[type=text]').val().trim().length == 0 ){
            $(this).closest('tr').find('.tp_buttons').addClass('disabled')
        }
    })

    $('#table_first5').on('click', '.btn-save', async function(){
        $('#success_tp_edit').css('display', 'none')
        let video_url;
        console.log('saving')
        console.log($(this).closest('tr').find('input[type=file]'))
        console.log($(this).closest('tr').find('input[type=text]').val())
        $(this).closest('tr').find('input[type=text]').removeClass('is-invalid')
        $(this).closest('tr').find('input[type=file]').removeClass('is-invalid')
        console.log($(`#${$(this).attr('data-id')}_cfl`).text())
        if($(this).closest('tr').find('input[type=text]').val()){
            console.log('If filechooser')
            $('.updateprogram').modal('show')
            const fileChooser = $(this).closest('tr').find('input[type=file]')
            if(fileChooser[0].files.length){
                const fileName = $(this).closest('tr').find('input[type=file]').val().split('\\')[2];
                const profilePicture = fileChooser[0].files[0];
                const objKey = `trade-program/${fileName}_${moment().valueOf()}`;
                const params = {
                Key: objKey,
                ContentType: profilePicture.type,
                Body: profilePicture,
                };
                var sUrl = await s3(params);
                if(sUrl){
                    video_url = sUrl;
                }
            }

            if($(`#${$(this).attr('data-id')}_cfl`).text() == ''){
                video_url = ''
            }
                let params = {
                    id : $(this).attr('data-id').trim(),
                    image : video_url,
                    caption : $(this).closest('tr').find('input[type=text]').val().trim(),
                    index : parseInt($(this).attr('data-id').trim())
                }
                if(video_url == undefined){
                    delete params.image
                }
                console.log('params', params)
                let update_tp = await axios.post('/api/update-trade-programs',  params)
                if(update_tp.data.payload == 'created' || update_tp.data.payload == 'updated'){
                    let tp;
                    console.log('video_url', video_url)
                    if(video_url == undefined){
                    $(this).closest('tr').html(`<td><img></td>
                    <td><input type="text" class="form-control" disabled id="caption_${$(this).attr('data-id')}" value="${$(this).closest('tr').find('input[type=text]').val().trim()}"></td>
                    <td><button type="button" class="btn btn-secondary-round btn-edit" data-id="${$(this).attr('data-id').trim()}">Edit Image</button></td>`)
                    }
                    else{   
                    $(this).closest('tr').html(`<td><img src="${video_url}"></td>
                    <td><input type="text" class="form-control" disabled id="caption_${$(this).attr('data-id')}" value="${$(this).closest('tr').find('input[type=text]').val().trim()}"></td>
                    <td><button type="button" class="btn btn-secondary-round btn-edit" data-id="${$(this).attr('data-id').trim()}">Edit Image</button></td>`)
                    }
                    $('#success_tp_edit').css('display', '')
                    window.scrollTo(0, 0);
                    setTimeout(function(){
                          $('.updateprogram').modal('hide');
                    }, 1000);
                    setTimeout(function()
                    { $('#success_tp_edit').css('display', 'none')
                    }, 180000);
                }
                else{
                    alert('API Error : Something went wrong!')
                }    
        }
        else{
            // if(!($(this).closest('tr').find('input[type=file]').val())){
            //     $(this).closest('tr').find('input[type=file]').addClass('is-invalid')
            // }
           if(!($(this).closest('tr').find('input[type=text]').val())){
                $(this).closest('tr').find('input[type=text]').addClass('is-invalid')
            }
            // else{
            //     $(this).closest('tr').find('input[type=text]').addClass('is-invalid')
            //     $(this).closest('tr').find('input[type=file]').addClass('is-invalid')
            // }
        }
    })

    if(window.location.pathname == '/trade-programs'){
        let trade_programs = await axios.get('/api/trade-programs')
        console.log(trade_programs.data)
        if(trade_programs.data.length){
            for(let i = 0; i < trade_programs.data.length; i++){
                $(`#caption_${trade_programs.data[i].id}`).val(trade_programs.data[i].caption)
                $(`#image_${trade_programs.data[i].id}`).attr('src', trade_programs.data[i].image)
                if(!trade_programs.data[i].image){
                    $(`#image_${trade_programs.data[i].id}`).removeAttr('src')
                }
            }
        }
    }

    if(window.location.pathname == '/pssp'){
        let trade_programs = await axios.get('/api/pssp')
        let price_program = await axios.get('/api/price-program')
        console.log(trade_programs.data)
        if(trade_programs.data.length){
            for(let i = 0; i < trade_programs.data.length; i++){
                $(`#stick_price_${trade_programs.data[i].id}`).text(trade_programs.data[i].stick_price)
                $(`#pack_price_${trade_programs.data[i].id}`).text(trade_programs.data[i].pack_price)
                $(`#image_${trade_programs.data[i].id}`).attr('src', trade_programs.data[i].image)
                if(!trade_programs.data[i].image){
                    $(`#image_${trade_programs.data[i].id}`).removeAttr('src')
                }
            }
        }
        if(price_program.data[1].is_shown == 1){
            $('#screen-pssp-img').attr('src', 'image/screen-pssp.png')
        }
        else{
            $('#screen-pssp-img').attr('src', 'image/screen-pssp-hidden.jpg')
        }
    }

    $('#show_hide').on('click', async function(){
        console.log($('#show_hide').text().trim())
        if($('#show_hide').text().trim() == 'Show'){
            $(this).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
            console.log('a')
            let showhide = await axios.post('/api/update-pages', {
                is_shown : 1
            })
            if(showhide.data.payload == 'created' || showhide.data.payload == 'updated'){
                $('#show_hide').html('<i class="far fa-eye-slash"></i> Hide')
                $('#show_hide').removeClass('btn-primary-round')
                $('#show_hide').addClass('btn-cancel-round')
                $('#success_alert_pages').css('display', '')
                setTimeout(function()
                { $('#success_alert_pages').css('display', 'none')
                }, 180000);
            }
            else{
                alert('UPDATE_PAGE_ERR')
            }
        }
        else{
            console.log('a')
            $(this).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
            let showhide = await axios.post('/api/update-pages', {
                is_shown : 0
            })
            if(showhide.data.payload == 'created' || showhide.data.payload == 'updated'){
                $('#show_hide').html('<i class="far fa-eye"></i> Show')
                $('#show_hide').removeClass('btn-cancel-round')
                $('#show_hide').addClass('btn-primary-round')
                $('#success_alert_pages').css('display', '')
                setTimeout(function()
                { $('#success_alert_pages').css('display', 'none')
                }, 180000);
            }
            else{
                alert('UPDATE_PAGE_ERR')
            }
        }
    })

        $('#product_name').on('keyup', async function(){
            if($('#product_name').val() == '' || $('#product_name').val().trim().length == 0){
                $('#product_name').addClass('is-invalid')
            }
            else{
                if(window.location.pathname.trim().split('&')[0] == '/edit-product'){
                    console.log('VALUE', $('#product_name').val())
                    console.log('DATA-SAVED', $('#product_name').attr('data-saved'))
                    if($('#product_name').val().trim() != $('#product_name').attr('data-saved').trim()){
                        let product_name = $(this).val().trim()
                        let validateDuplicate = await axios.post('/api/validate-product', {product_name,})
                        if(Object.keys(validateDuplicate.data.payload).length){
                            $('#product_name').addClass('is-invalid')
                            $('#product_name').next().text('Product already existed')
                            $('#stick_price_retail').trigger('keyup')
                        }
                        else{
                            $('#product_name').removeClass('is-invalid')
                            $('#product_name').next().text('This is a required field | Max of (25) Characters Only')
                            $('#stick_price_retail').trigger('keyup')
                        }
                    }
                }
                else{
                    let product_name = $(this).val().trim()
                    let validateDuplicate = await axios.post('/api/validate-product', {product_name,})
                    if(Object.keys(validateDuplicate.data.payload).length){
                        $('#product_name').addClass('is-invalid')
                        $('#product_name').next().text('Product already existed')
                        $('#stick_price_retail').trigger('keyup')
                    }
                    else{
                        $('#product_name').removeClass('is-invalid')
                        $('#product_name').next().text('This is a required field | Max of (25) Characters Only')
                        $('#stick_price_retail').trigger('keyup')
                    }
                }
            }   
        })

    $('#remove-image').on('click', function(){
        $('#invalid-image').removeClass('is-invalid')
    })

    $('#add-product-btn').on('click', async function(){
        window.onbeforeunload = null;
        $(this).append('    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
        $(this).addClass('disabled')
        $(`.page-products input`).removeClass('is-invalid')
        let missingFields = [];
        let requiredFields = ['product_name', 'stick_price_retail', 'pack_price_retail', 'carton_price_retail', 'stick_price_wholesale', 'pack_price_wholesale', 'carton_price_wholesale', 'product-position']
        for(let i = 0 ; i < requiredFields.length; i++){
            if(!($(`#${requiredFields[i]}`).val())){
                if(window.location.pathname.trim().split('&')[0] == '/edit-product'){
                    if($('#product-image-img').attr('src') == 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D'){
                        missingFields.push(requiredFields[i])
                    }
                }
                if($('#product-position').val() == 'Choose product position'){
                    missingFields.push(requiredFields[i])
                }
                else{
                    missingFields.push(requiredFields[i])
                }
            }
        }
        console.log('missing fields', missingFields)
        if(missingFields.length){
            $(this).text('Add')
            $(this).removeClass('disabled')
            for(let i = 0; i < missingFields.length ; i++){
                $(`#${missingFields[i]}`).addClass('is-invalid')
                if(missingFields[i] == 'product_name'){
                    $('#product_name').next().text('This is a required field')
                }
                if(missingFields[i] == 'product_image'){
                    $('#invalid-image').addClass('is-invalid')
                    $('#if_invalid_image').text('This is a required field | File Format: PNG or JPG | File size: Max of 5 MB | 1 image upload only')
                }
                
            }
        }
        else{
            //Save product here//
            $('#addproduct').modal('show');
            let parameter = {
                name : $('#product_name').val(),
                name_capitalized : $('#product_name').val().toUpperCase(),
                image : '',
                order : parseInt($('#product-position').val()),
                retail : {
                    stick_price : parseFloat($('#stick_price_retail').val()),
                    pack_price : parseFloat($('#pack_price_retail').val()), 
                    carton_price : parseFloat($('#carton_price_retail').val())
                },
                wholesale : {
                    stick_price : parseFloat($('#stick_price_wholesale').val()),
                    pack_price : parseFloat($('#pack_price_wholesale').val()),
                    carton_price : parseFloat($('#carton_price_wholesale').val())
                },
                is_enabled : 1
            }
            if($('#product-position') == 'Choose product position'){
                delete parameter.order
            }
            const fileChooser = document.getElementById(`product_image`);
            const fileName = $('#product_image').val().split('\\')[2];
            if (fileChooser.files[0]) {
                console.log('If filechooser')
                const profilePicture = fileChooser.files[0];
                const objKey = `product-images/${fileName}_${moment().valueOf()}`;
                const params = {
                  Key: objKey,
                  ContentType: profilePicture.type,
                  Body: profilePicture,
                };
                var sUrl = await s3(params);
                if(sUrl){
                    parameter.image = sUrl;
                }
            }
            if(window.location.pathname == '/add-product'){
                console.log('Adding new product : ', parameter)
                let addProduct = await axios.post('/api/add-product', parameter)
                if(addProduct.data.payload == 'created'){
                    $('.progress-bar').css('width', `100%`)
                    window.onbeforeunload = null;
                    setTimeout(function(){ 
                        window.location.href = '/products';
                    }, 500);
                    localStorage.setItem('newProduct', parameter.name);
                }
                else{
                    swal("Error!", "Something went wrong", "error");
                    $(this).removeClass('disabled')
                    $('#product-btn-loader').css('display', 'none')
                }
            }
            else{
                if(parameter.image == ''){
                    delete parameter.image;
                }
                parameter.id = window.location.pathname.trim().split('&')[1].split('=')[1]
                let updateProduct = await axios.patch('/api/update-product', parameter)
                if(updateProduct.data.payload == 'updated'){
                    $('.progress-bar').css('width', `100%`)
                    window.onbeforeunload = null;
                    setTimeout(function(){ 
                        window.location.href = '/products';
                    }, 500);
                    localStorage.setItem('editedProduct', JSON.stringify(parameter));
                }
                else{
                    swal("Error!", "Something went wrong", "error");
                    $(this).removeClass('disabled')
                    $('#product-btn-loader').css('display', 'none')
                }
            }

        }
    })

    $('#products tbody').on('click','.edit-btn', async function(){
        window.location.href = `/edit-product&id=${$(this).attr('id')}`
    })

    $('#products tbody').on('click','.delete-btn', async function(){
        let product = await axios.post(`/api/product/${$(this).attr('id')}`)
        if(product.data.payload){
            $('#delete-modal-product-name').text(product.data.payload.name)
            $('.deleteProductBtn').attr('id', product.data.payload.id)
        }
    })

    if(window.location.pathname.trim().split('&')[0] == '/edit-product'){
        $('#product').addClass('active')
        $('#add-product-btn').addClass('disabled')
        let has = -1
        let product = await axios.post(`/api/product/${window.location.pathname.trim().split('&')[1].split('=')[1]}`)
        console.log('Product', product.data.payload);
        if(product.data.payload.name){
            $('#product_name').val(product.data.payload.name)
            $('#product_name').attr('data-saved', product.data.payload.name)
            has+=1
        }
        if(product.data.payload.order){
            var o = new Option(product.data.payload.order, product.data.payload.order);
            $(o).html(product.data.payload.order);
            $("#product-position").append(o);
            $(`#product-position`).val(product.data.payload.order)
            $(`#product-position`).attr('data-saved', product.data.payload.order)
            $(`#product-position`).selectpicker('refresh')
            has+=1
        }
        if(product.data.payload.image){
            $('.image-upload-wrap').hide();
            $('#product-image-img').attr('src', product.data.payload.image);
            $('#product-image-img').attr('data-saved', product.data.payload.image);
            $('.file-upload-content').show();
            has+=1
        }
        if(product.data.payload.retail){
            if(product.data.payload.retail.stick_price){
                $('#stick_price_retail').val(product.data.payload.retail.stick_price)
                $('#stick_price_retail').attr('data-saved', product.data.payload.retail.stick_price)
                has+=1
            }
            if(product.data.payload.retail.pack_price){
                $('#pack_price_retail').val(product.data.payload.retail.pack_price)
                $('#pack_price_retail').attr('data-saved', product.data.payload.retail.pack_price)
                has+=1
            }
            if(product.data.payload.retail.carton_price){
                $('#carton_price_retail').val(product.data.payload.retail.carton_price)
                $('#carton_price_retail').attr('data-saved', product.data.payload.retail.carton_price)
                has+=1
            }
        }
        if(product.data.payload.wholesale){
            if(product.data.payload.wholesale.stick_price){
                $('#stick_price_wholesale').val(product.data.payload.wholesale.stick_price)
                $('#stick_price_wholesale').attr('data-saved', product.data.payload.wholesale.stick_price)
                has+=1
            }
            if(product.data.payload.wholesale.pack_price){
                $('#pack_price_wholesale').val(product.data.payload.wholesale.pack_price)
                $('#pack_price_wholesale').attr('data-saved', product.data.payload.wholesale.pack_price)
                has+=1
            }
            if(product.data.payload.wholesale.carton_price){
                $('#carton_price_wholesale').val(product.data.payload.wholesale.carton_price)
                $('#carton_price_wholesale').attr('data-saved', product.data.payload.wholesale.carton_price)
                has+=1
            }
        }
        console.log(has);
        $('.progress-bar').css('width', `${(has) * 11.11}%`)
    }

    if(window.location.pathname.trim().split('&')[1] == 'action=edit'){
        $('#messages').addClass('active')
        $(`.message-content_s`).text(`Character/s Remaining:  ${60 - $(`.message-content`).val().length}`)
        $('.edit-message').trigger('click');
    }

    
    $(window).bind('beforeunload', function() {
        if(window.location.pathname ==  '/add-product'){
            let requiredFields = ['product_name', 'product_image', 'stick_price_retail', 'pack_price_retail', 'carton_price_retail', 'stick_price_wholesale', 'pack_price_wholesale', 'carton_price_wholesale']
            for(let i = 0 ; i < requiredFields.length; i++){
                if(($(`#${requiredFields[i]}`).val())){
                    if(!($('#addproduct').hasClass('show'))){
                        return 'Are you sure you want to leave?'
                    }
                }
            }
        } 
        if(window.location.pathname.trim().split('&')[0] == '/edit-product'){
            let requiredFields = ['product_name', 'product_image', 'stick_price_retail', 'pack_price_retail', 'carton_price_retail', 'stick_price_wholesale', 'pack_price_wholesale', 'carton_price_wholesale']
            for(let i = 0 ; i < requiredFields.length; i++){
                if(($(`#${requiredFields[i]}`).val())){
                    if(!($('#addproduct').hasClass('show'))){
                        return 'Are you sure you want to leave?'
                    }
                }
            }
        } 
        if(window.location.pathname.trim().split('&')[1] == 'action=edit'){
            console.log($('.message-content').attr('disabled'))
            if(!$('.message-content').attr('disabled')){
                if($(`.message-content`).val() != $(`.message-content`).attr('id')){
                    return 'Are you sure you want to leave?'
                }
            }
        }
        if(window.location.pathname ==  '/trade-programs'){
            if($('.removeImage').length){
                return 'Are you sure you want to leave?'
            }   
        } 
        if(window.location.pathname ==  '/cbf-videos'){
            if($('#update-cbf-video').is(":visible")){
                if( !$('#update-cbf-video').hasClass('disabled') ){
                    return 'Are you sure you want to leave?'
                }
            }
        } 
        if(window.location.pathname ==  '/power-of-brand'){
            if($('.update-video-pb').is(":visible")){
                if( !$('.update-video-pb').hasClass('disabled') ){
                    return 'Are you sure you want to leave?'
                }
            }
        } 
        if(window.location.pathname ==  '/add-user'){
            let requiredFields = ['user_full_name', 'user_email_address', 'user_type']
            for(let i = 0 ; i < requiredFields.length; i++){
                if(($(`#${requiredFields[i]}`).val())){
                    if($('#adduser').is(":visible") == false){
                        return 'Are you sure you want to leave?'
                    }
                }
            }
        } 
        if(window.location.pathname ==  '/edit-user'){
            console.log($('#adduser').is(":visible"))
            let requiredFields = ['user_full_name', 'user_email_address', 'user_type']
            for(let i = 0 ; i < requiredFields.length; i++){
                if(($(`#${requiredFields[i]}`).val())){
                    if($('#adduser').is(":visible") == false){
                        return 'Are you sure you want to leave?'
                    }
                }
            }
        } 
        if(window.location.pathname ==  '/change-password'){
            let requiredFields = ['cp_password', 'cp_new_password', 'cp_confirm_password']
            for(let i = 0 ; i < requiredFields.length; i++){
                if(($(`#${requiredFields[i]}`).val())){
                    return 'Are you sure you want to leave?'
                }
            }
        }
        if(window.location.pathname ==  '/pssp'){
            if($('.pssp_action_btn').is(":visible")){
                return 'Are you sure you want to leave?'
            }
        }
        if(window.location.pathname ==  '/price-program'){
            if($('input[type=text]').is(":visible")){
                return 'Are you sure you want to leave?'
            }
        }
        
    });

    $('.validator_c').on('keyup', function(){
        console.log($(this).val().toString().split('.'))
        let thisElement = $(this)
        if($(this).val().toString().split('.').length == 2){
            if($(this).val().toString().split('.')[1].length > 2){
                $(this).val( parseFloat($(this).val()).toFixed(2) )
            }
        }
        if($(this).val().toString().split('.').length == 1){
            if($(this).val().length > 4){
                $(this).val( `${$(this).val()[0]}${$(this).val()[1]}${$(this).val()[2]}${$(this).val()[3]}` )
            }
        }
        if(thisElement.val() <= 0){
            thisElement.val('')
        } 
    })

    $('#table_pssp tbody').on('keyup', '.validator_tp',function(){
        console.log($(this).val().toString().split('.'))
        if($(this).val().toString().split('.').length == 2){
            if($(this).val().toString().split('.')[1].length > 2){
                $(this).val( parseFloat($(this).val()).toFixed(2) )
            }
        }
        if($(this).val().toString().split('.').length == 1){
            if($(this).val().length > 4){
                $(this).val( `${$(this).val()[0]}${$(this).val()[1]}${$(this).val()[2]}${$(this).val()[3]}` )
            }
        }
    })

    $('.completion').on('keyup', function(){
        setTimeout(() => {
        let has = 0;
            let arrs = [];
            let requiredFields = ['product_name','product-image-img', 'stick_price_retail', 'pack_price_retail', 'carton_price_retail', 'stick_price_wholesale', 'pack_price_wholesale', 'carton_price_wholesale', 'product-position' ]
            for(let i = 0 ; i < requiredFields.length; i++){
                if(($(`#${requiredFields[i]}`).val()) && !($(`#${requiredFields[i]}`).hasClass('is-invalid')) && ( $(`#${requiredFields[i]}`).val().trim().length > 0 )){
                    console.log(requiredFields[i])
                    has += 1;
                    arrs.push(requiredFields[i])
                }
                if(requiredFields[i] == 'product-image-img'){
                        console.log('RED_INFO', $("#product-image-img").css('border-color'))
                        if($("#product-image-img").attr('src') == '#' || $("#product-image-img").css('border-color') == 'rgb(255, 0, 0)' || $('#invalid-image').hasClass('is-invalid') ){
                            console.log('a')
                            has = has - 1
                        }
                        else{
                            console.log('a')    
                            has = has + 1
                            arrs.push(requiredFields[i])
                        }
                    
                }
            }
            if($('#product-position').val() == 'Choose product position'){
                has = has - 1
                console.log('a')
            }
            if(window.location.pathname.split('&')[0] == '/edit-product'){
                has = has + 1
                console.log('a')
            }
            console.log(has)
            console.log(arrs)
        $('.progress-bar').css('width', `${(arrs.length) * 9.72}%`)
        if(arrs.length == 9){
            $('.progress-bar').css('width', `100%`)
        }
        const element = document.querySelector('.progress-bar')
        const width = element.style.width
        console.log(width)
        if(arrs.length >= 9){
            if(window.location.pathname.split('&')[0] == '/edit-product'){
                let modified = 0;
                $("#add-edit-product-form input").each(function() {
                    console.log(this.value+' '+ $(this).attr('data-saved'))
                    if($(this).attr('data-saved') != $(this).val()) {
                        console.log($(this).attr('id'))
                        modified+=1;
                        if($(this).attr('id') == 'product_image'){
                            modified-=1;
                        }
                    }
                });
                if( $('#product-image-img').attr('src') != $('#product-image-img').attr('data-saved')){
                    modified+=1;
                }
                if( $('#product-position').val() != $('#product-position').attr('data-saved')){
                    modified+=1;
                }
                console.log('let modified', modified)
                if(!modified){
                    $('.add-edit-btns').addClass('disabled')
                }
                else{
                    $('.add-edit-btns').removeClass('disabled')
                }
            }
            else{
                $('.add-edit-btns').removeClass('disabled')
            }
            
        }
        else{
            $('.add-edit-btns').addClass('disabled')
        }
    }, 500);
    })

    $('.completion_c').on('change', function(){
        $('.completion').trigger('keyup')
    })

    $('.completion').on('input', function(){
        $('.completion').trigger('keyup')
    })
    if(window.location.pathname == '/add-product' || window.location.pathname.split('&')[0] == '/edit-product' ){
        $(".completion_i").on('load', function () {
            $('.completion').trigger('keyup')
        });
        $('.completion').trigger('keyup')
        $('#product_name').removeClass('is-invalid')
    }

    $('.user-completion').on('keydown', function(){
        setTimeout(function(){
        let has = 0;
        let requiredFields = ['user_full_name', 'user_email_address', 'user_type']
        for(let i = 0 ; i < requiredFields.length; i++){
            if(($(`#${requiredFields[i]}`).val()) && !($(`#${requiredFields[i]}`).hasClass('is-invalid'))){
                has += 1;
            }
        }
        console.log(has);
        if(has == 3){
            $('#add_user_btn').removeClass('disabled')
        }
        else{
            $('#add_user_btn').addClass('disabled')
        }
    }, 2000);
    })
    $('.user-completion').on('change', function(){
        setTimeout(function(){
            let has = 0;
            let requiredFields = ['user_full_name', 'user_email_address', 'user_type']
            for(let i = 0 ; i < requiredFields.length; i++){
                if(($(`#${requiredFields[i]}`).val()) && !($(`#${requiredFields[i]}`).hasClass('is-invalid'))){
                    has += 1;
                }
            }
            console.log(has);
            if(has == 3){
                $('#add_user_btn').removeClass('disabled')
            }       
             else{
                $('#add_user_btn').addClass('disabled')
            }
        }, 1000);
    })

    $('.cp_inputs').on('keyup', function(){
        let data = []
        $('.cp_inputs').each(function() {
            if(this.value != ''){
                data.push(this.value)
            }
        });
        if(data.length){
            $('#cp_cancel_btn').removeClass('disabled')
        }
        else{
            $('#cp_cancel_btn').addClass('disabled')
        }
        console.log(data)
        let requiredFields = ['cp_password', 'cp_new_password', 'cp_confirm_password']
        let hasMissing = 0;
        setTimeout(() => {
            for(let i = 0; i < requiredFields.length; i++){
                if( $(`#${requiredFields[i]}`).hasClass('is-invalid') || $(`#${requiredFields[i]}`).val() == ''){
                    hasMissing = 1;
                    break;
                }
            }
            console.log(hasMissing)
            if(!hasMissing){
                $('.cp_actn_btn').removeClass('disabled')
            }
            else{
                $('.cp_actn_btn').addClass('disabled')
            }
         }, 1500);
        
    })

    
    $('.reset_pass_inputs').on('keyup', function(){
        let has = 0;
        let requiredFields = ['new_password', 'confirm_password']
        setTimeout(() => {
        for(let i = 0 ; i < requiredFields.length; i++){
            if(($(`#${requiredFields[i]}`).val()) && !($(`#${requiredFields[i]}`).hasClass('is-invalid'))){
                has += 1;
            }
        }
        console.log(has)
        if(has == 2){
            $('.reset_pass_btn').removeClass('disabled')
        }
        else{
            $('.reset_pass_btn').addClass('disabled')
        }
    }, 1500);
    })

    $("#cp_password").on('keyup', async function() {
        let value = $(this).val()
        setTimeout(async function(){ 
            let validate_email = await axios.post(`/api/password-validator-in-es/${value}`)
            console.log('Response:',validate_email.data.payload)
            if(validate_email.data.payload == true){
                $('#cp_password').removeClass('is-invalid')
                $('.current_password_if').text('This is a required field')
            }
            else{
                $('#cp_password').addClass('is-invalid')
                $('.current_password_if').text('Incorrect password')
            }
        }, 500);
    });

    
    $('#table_pssp tbody').on('change', '.pssp_file_input', function(){
        console.log('changed')
        console.log($(this)[0].files[0].name)
        console.log( $(this).nextAll('.custom-file-label').text() )
        $(this).nextAll('.custom-file-label').html($(this)[0].files[0].name)
        var files = $(this)[0].files[0]
        var filesize = ((files.size/1024)/1024).toFixed(4);
        console.log('filesize', filesize)
        if(filesize >  5){
            console.log(true)
            $(this).addClass('is-invalid')
            $(this).closest('tr').find('.pssp_action_btn').addClass('disabled')
        }
        else{
            if($(this)[0].files[0].type != 'image/jpeg' && $(this)[0].files[0].type != 'image/png'){
                console.log(true)
                $(this).closest('tr').find('.pssp_action_btn').addClass('disabled')
                $(this).addClass('is-invalid')
            }
            else{
                $(this).closest('tr').find('.pssp_action_btn').removeClass('disabled')
                $(this).removeClass('is-invalid')
            }
        }
        console.log($(this)[0].files[0].type)
        console.log($(this)[0].files[0].type != 'image/jpeg' )
        console.log($(this)[0].files[0].type != 'image/png' )
    })

    $('#table_pssp tbody').on('click', '.editPssp' , async function(){
        let id = $(this).attr('id')
        console.log('Pssp edit', id)
        let data = await axios.post('/api/pssp', {id})
        let returnData = data.data.payload;
        console.log(returnData)
        if(returnData.image){
            $(this).closest('tr').html(`<td><img src="${returnData.image}"></td>
        <td>
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text" id="inputGroupFileAddon01">Upload Image</span>
            </div>

            <div class="custom-file">
              <input type="file" class="custom-file-input pssp_file_input pssp_fi_${id}" id="${id}_i" accept="image/jpg, image/png"
                aria-describedby="inputGroupFileAddon01" required>
              <label class="custom-file-label" style="text-align:left;display:inline-block;text-overflow: clip;overflow: hidden;" for="inputGroupFile01">${data.data.payload.image.split('/')[4].split('.')[0]}.jpg</label>
            </div>
          </div>

         <span class="badge badge-danger">File Format: PNG or JPG | File size: Max of 5 MB</span>

        </td>
        <td>
          <input type="number" class="form-control form-enable pssp_inputs stick_price validator_tp" onkeyup="psspInput(this, 'stick_price')"  value="${returnData.stick_price}" min="1"  required oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''}">
          <div class="feedback">This  is a required field</div>
        </td>
        <td><input type="number" class="form-control form-enable pssp_inputs pack_price validator_tp" onkeyup="psspInput(this, 'pack_price')" value="${returnData.pack_price}" min="1"  required oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''}">
        <div class="feedback">This  is a required field</div>
        </td>
        <td>
            <a type="button" class="btn btn-success-round pssp_action_btn save-pssp" data-id="${returnData.id}" >Save</a>
            <a type="button" class="btn btn-cancel-round cancel-pssp" data-id="${returnData.id}">Cancel</a>
        </td>`)
        }
        else{
        $(this).closest('tr').html(`<td><img src="${returnData.image}"></td>
        <td>
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text" id="inputGroupFileAddon01">Upload Image</span>
            </div>

            <div class="custom-file">
              <input type="file" class="custom-file-input pssp_file_input pssp_fi_${id}" id="${id}_i" accept="image/jpg, image/png"
                aria-describedby="inputGroupFileAddon01" required>
              <label class="custom-file-label" style="text-align:left;display:inline-block;text-overflow: clip;overflow: hidden;" for="inputGroupFile01">Choose file</label>
            </div>
          </div>

         <span class="badge badge-danger">File Format: PNG or JPG | File size: Max of 5 MB</span>

        </td>
        <td>
          <input type="number" class="form-control form-enable pssp_inputs stick_price" onkeyup="psspInput(this,'stick_price')" oninput="psspInput(this, 'stick_price')"   value="${returnData.stick_price}" min="1" required>
          <div class="feedback">This  is a required field</div>
        </td>
        <td><input type="number" class="form-control form-enable pssp_inputs pack_price" onkeyup="psspInput(this,'pack_price')" oninput="psspInput(this,'pack_price')" value="${returnData.pack_price}" min="1" required>
        <div class="feedback">This  is a required field</div>
        </td>
        <td>
            <a type="button" class="btn btn-success-round disabled pssp_action_btn save-pssp" data-id="${returnData.id}" >Save</a>
            <a type="button" class="btn btn-cancel-round cancel-pssp" data-id="${returnData.id}">Cancel</a>
        </td>`)
        }
    })

    $('#table_pssp tbody').on('click', '.cancel-pssp', async function(){
        console.log('clicked');
        let data = await axios.post('/api/pssp', { id : $(this).attr('data-id')})
        $(this).closest('tr').html(`<td><img src="${data.data.payload.image}" id="image_${$(this).attr('data-id')}"></td>
        <td>
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text" id="inputGroupFileAddon01" disabled>Upload Image</span>
            </div>

            <div class="custom-file">
              <input type="file" class="custom-file-input" id="inputGroupFile01 accept="image/jpg, image/png"
                aria-describedby="inputGroupFileAddon01" required disabled>
              <label class="custom-file-label" for="inputGroupFile01">Choose file</label>
            </div>
          </div>
        </td>
        <td id="stick_price_${$(this).attr('data-id')}">${data.data.payload.stick_price}</td>
        <td id="pack_price_${$(this).attr('data-id')}">${data.data.payload.pack_price}</td>
        <td><button type="button" class="btn btn-secondary-round editPssp" id="${$(this).attr('data-id')}">Edit</button>
        </td>`)
    })

    $('#table_pssp tbody').on('click', '.save-pssp', async function(){
        let video_url;
        let stick_price = $(this).closest('tr').find('.stick_price').val()
        let pack_price = $(this).closest('tr').find('.pack_price').val()
        let id = $(this).attr('data-id').trim()
        let htmlThis = $(this)
        console.log('saving')
        $(this).closest('tr').find('input[type=text]').removeClass('is-invalid')
        $(this).closest('tr').find('input[type=file]').removeClass('is-invalid')
        if($(this).closest('tr').find('.pack_price').val() && $(this).closest('tr').find('.stick_price').val()){
            console.log('If filechooser')
            $('#updatepssp').modal('show')
            const fileChooser = $(this).closest('tr').find('input[type=file]')
            if(fileChooser[0].files.length){
                const fileName = $(this).closest('tr').find('input[type=file]').val().split('\\')[2];
                const profilePicture = fileChooser[0].files[0];
                const objKey = `pssp/${fileName}_${moment().valueOf()}`;
                const params = {
                Key: objKey,
                ContentType: profilePicture.type,
                Body: profilePicture,
                };
                var sUrl = await s3(params);
                if(sUrl){
                    video_url = sUrl;
                }
            }
                let params = {
                    id : $(this).attr('data-id').trim(),
                    stick_price : parseFloat(stick_price),
                    pack_price : parseFloat(pack_price),
                    image : video_url
                }
                if(!video_url){
                    delete params.image
                }
                let update_tp = await axios.post('/api/update-pssp',  params)
                if(update_tp.data.payload == 'created' || update_tp.data.payload == 'updated'){
                    setTimeout(async function(){
                    let data = await axios.post('/api/pssp', {id})
                    console.log('data',data)
                    htmlThis.closest('tr').html(`<td><img src="${data.data.payload.image}" id="image_${id}"></td>
                    <td>
                      <div class="input-group">
                        <div class="input-group-prepend">
                          <span class="input-group-text" id="inputGroupFileAddon01" disabled>Upload Image</span>
                        </div>
            
                        <div class="custom-file">
                          <input type="file" class="custom-file-input" id="inputGroupFile01 accept="image/jpg, image/png"
                            aria-describedby="inputGroupFileAddon01" required disabled>
                          <label class="custom-file-label" for="inputGroupFile01">Choose file</label>
                        </div>
                      </div>
                    </td>
                    <td id="stick_price_${id}">${stick_price}</td>
                    <td id="pack_price_${id}">${pack_price}</td>
                    <td><button type="button" class="btn btn-secondary-round editPssp" id="${id}">Edit</button>
                    </td>`)
                    $('#success_pssp_edit').css('display', '')
                   }, 1000);
                    setTimeout(function()
                    { $('#success_pssp_edit').css('display', 'none')
                    }, 180000);
                    setTimeout(function()
                    {$('#updatepssp').modal('hide');
                    window.scrollTo(0, 0);
                    }, 1000);
                   
                }
                else{
                    alert('API Error : Something went wrong!')
                }
        }
        else{
            if(!($(this).closest('tr').find('.stick_price').val())){
                $(this).closest('tr').find('.stick_price').addClass('is-invalid')
            }
            else if(!($(this).closest('tr').find('.pack_price').val())){
                $(this).closest('tr').find('.pack_price').addClass('is-invalid')
            }
            else if(!($(this).closest('tr').find('input[type=file]').val())){
                $(this).closest('tr').find('input[type=file]').addClass('is-invalid')
            }
            else{
                $(this).closest('tr').find('.pack_price').addClass('is-invalid')
                $(this).closest('tr').find('.stick_price').addClass('is-invalid')
                $(this).closest('tr').find('input[type=file]').addClass('is-invalid')
            }
        }
    })

    $('.show-hide-video').on('click', async function(){
        let current_stats = $(this).text().trim();
        console.log('current stats', current_stats)
        if(current_stats == 'Show Interactive Screen - Hide Video'){
            let update_video = await axios.post('/api/update-video-pb', {
                page_shown : 'Interactive Screen'
            })
            if(update_video.data.payload == 'updated'){
                $(this).text('Show Video - Hide Interactive Screen')
                $('#pb_img_interactive').attr('src', 'image/screen-powerbrand-interactive-show.png')
                $('#pb_img_video').attr('src', 'image/screen-powerbrand-video-hide.png')
            }
        }
        else{
            let update_video = await axios.post('/api/update-video-pb', {
                page_shown : 'Video Screen'
            })
            if(update_video.data.payload == 'updated'){
                $(this).text('Show Interactive Screen - Hide Video')
                $('#pb_img_interactive').attr('src', 'image/screen-powerbrand-interactive-hide.png')
                $('#pb_img_video').attr('src', 'image/screen-powerbrand-video-show.png')
            }
        }
    })

    $('.update-video-pb').on('click', async function(){
        let video_url;
        $(this).addClass('disabled')
        $(this).append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
        const fileChooser = $('.pb_fileInput')
        const fileName = $('.pb_fileInput').val().split('\\')[2];
        var files = fileChooser[0].files[0]
        var filesize = ((files.size/1024)/1024).toFixed(4);
        console.log('filesize', filesize)
            $('#updatepowerofbrand').modal('show')
            console.log('Validation passed')
            if (fileChooser[0].files[0]) {
                console.log('If filechooser')
                const profilePicture = fileChooser[0].files[0];
                const objKey = `cbf-video/${fileName}_${moment().valueOf()}`;
                const params = {
                Key: objKey,
                ContentType: profilePicture.type,
                Body: profilePicture,
                };
                var sUrl = await s3(params);
                if(sUrl){
                    video_url = sUrl;
                }
            }
            if(video_url){
                let update_video = await axios.post('/api/update-video-pb', {
                    video : video_url,
                    filename : fileName,
                })
                if(update_video.data.payload == 'updated'){
                    $('.update-video-pb').html('Update New Video ')
                    $('.update-video-pb').addClass('disabled')
                    $('.pb_video_container').attr('src', video_url);
                    $('#pb_input_filename').html('Choose file')
                    $('#updatepowerofbrand').modal('hide')
                    $('#success_pb_alert').css('display', '')
                    setTimeout(function()
                    { $('#success_pb_alert').css('display', 'none')
                    }, 180000);
                }
            }
    })

    $('.pb_fileInput').on('change', function(){
        console.log('changed')
        console.log($(this)[0].files[0].name)
        console.log( $(this).nextAll('.custom-file-label').text() )
        $(this).nextAll('.custom-file-label').html($(this)[0].files[0].name)
        var files = $(this)[0].files[0]
        var filesize = ((files.size/1024)/1024).toFixed(4);
        console.log('filesize', filesize)
        if(filesize >  40 || files.type != 'video/mp4'){
            $(this).addClass('is-invalid')
            $('.cancel-video-pb').removeClass('disabled')
            $('.update-video-pb').addClass('disabled')
        }
        else{
            $('.update-video-pb').removeClass('disabled')
            $('.cancel-video-pb').removeClass('disabled')
            $(this).removeClass('is-invalid')
        }
    })

    $('.cancel-video-pb').on('click', function(){
        $('.cancel-video-pb').addClass('disabled')
        $('.pb_fileInput').removeClass('is-invalid')
        $('.pb_fileInput').val('');
        $('.pb_fileInput').nextAll('.custom-file-label').text('Choose file')
        $('.update-video-pb').addClass('disabled')
    })

    $('.product-rewards tbody').on('click', '.btn-edit-25' ,async function(){
        console.log('btn-edit-25')
        console.log( $(this).attr('id') )
        console.log( $(this).closest('table').attr('id') )
        let data_id = $(this).attr('id').trim();
        let price_program = await axios.get('/api/price-program')
        if( $(this).closest('table').attr('id') == 'retail-table'){
            price_program.data = price_program.data[0];
        }
        else{
            price_program.data = price_program.data[1];
        }
        console.log(price_program.data)
        if(price_program.data){
            switch(data_id){
                case 'f2r':
                    if(price_program.data.second_row){
                        $(this).closest('tr').html(`<td>2</td>
                        <td></td>
                        <td><input type="number" class="form-control form-enable" value="${price_program.data.second_row.percentage_value}" id="${price_program.data.second_row.percentage_value}" min="1" max="9" required onkeydown="if(event.key==='.'){event.preventDefault();}" oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''};if(this.value > 100){this.value = 100}"></td>
                        <td><input type="text" maxlength="20" class="form-control form-enable" value="${price_program.data.second_row.label}" id="${price_program.data.second_row.label}" required></td>
                        <td><input type="number" class="form-control form-enable" value="${price_program.data.second_row.carton_price}" id="${price_program.data.second_row.carton_price}" min="1" required oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''}"></td>
                        <td>
                          <div class="btn-group" role="group" aria-label="Basic example">
                              <button type="button" class="btn btn-secondary cancel-pp" id="f2r">Cancel</button>
                              <a class="btn btn-success save-pp disabled" id="f2r">Save</a>
                          </div>
                        </td>`)
                    }
                break;
                case 'f3r':
                    if(price_program.data.third_row){
                        $(this).closest('tr').html(`<td>3</td>
                        <td></td>
                        <td><input type="number" class="form-control form-enable" value="${price_program.data.third_row.percentage_value}" id="${price_program.data.third_row.percentage_value}" min="1" max="9" required onkeydown="if(event.key==='.'){event.preventDefault();}" oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''};if(this.value > 100){this.value = 100}"></td>
                        <td><input type="text" maxlength="20" class="form-control form-enable" value="${price_program.data.third_row.label}" id="${price_program.data.third_row.label}" required></td>
                        <td><input type="number" class="form-control form-enable" value="${price_program.data.third_row.carton_price}" id="${price_program.data.third_row.carton_price}" min="1" required oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = '';}if(this.value <= 0.99){this.value = ''}"></td>
                        <td>
                          <div class="btn-group" role="group" aria-label="Basic example">
                              <button type="button" class="btn btn-secondary cancel-pp" id="f3r">Cancel</button>
                              <a class="btn btn-success save-pp disabled" id="f3r">Save</a>
                          </div>
                        </td>`)
                    }
                break;
                case 'f4r':
                    if(price_program.data.fourth_row){
                            $(this).closest('tr').html(`<td>4</td>
                            <td></td>
                            <td><input type="number" class="form-control form-enable" value="${price_program.data.fourth_row.percentage_value}" id="${price_program.data.fourth_row.percentage_value}" min="1" max="9" required onkeydown="if(event.key==='.'){event.preventDefault();}" oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''};if(this.value > 100){this.value = 100}"></td>
                            <td><input type="text" maxlength="20" class="form-control form-enable" value="${price_program.data.fourth_row.label}" id="${price_program.data.fourth_row.label}" required></td>
                            <td><input type="number" class="form-control form-enable" value="${price_program.data.fourth_row.carton_price}" id="${price_program.data.fourth_row.carton_price}" min="1" required oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''};if(this.value <= 0.99){this.value = ''}"></td>
                            <td>
                              <div class="btn-group" role="group" aria-label="Basic example">
                                  <button type="button" class="btn btn-secondary cancel-pp" id="f4r">Cancel</button>
                                  <a class="btn btn-success save-pp disabled" id="f4r">Save</a>
                              </div>
                            </td>`)
                        }
                break;
                case 'f5r' : 
                if(price_program.data.fifth_row){
                    $(this).closest('tr').html(`<td>5</td>
                    <td></td>
                    <td><input type="number" class="form-control form-enable" value="${price_program.data.fifth_row.percentage_value}" id="${price_program.data.fifth_row.percentage_value}" min="1" max="9" required onkeydown="if(event.key==='.'){event.preventDefault();}" oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''};if(this.value > 100){this.value = 100}"></td>
                    <td><input type="text" maxlength="20" class="form-control form-enable" value="${price_program.data.fifth_row.label}" id="${price_program.data.fifth_row.label}" required></td>
                    <td><input type="number" class="form-control form-enable" value="${price_program.data.fifth_row.carton_price}" id="${price_program.data.fifth_row.carton_price}" min="1" required oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''};if(this.value <= 0.99){this.value = ''}"></td>
                    <td>
                      <div class="btn-group" role="group" aria-label="Basic example">
                          <button type="button" class="btn btn-secondary cancel-pp" id="f5r">Cancel</button>
                          <a class="btn btn-success save-pp disabled" id="f5r">Save</a>
                      </div>
                    </td>`)
                }   
                break;
            }
        }
    })

    $('.product-rewards tbody').on('keyup', 'input' , async function(){
        console.log('table input keyup' , $(this).attr('type'))
        let thisHtml = $(this)
        let cur_value = $(this).val()
        let saved_value = $(this).attr('id').trim()
        console.log('cur_value', cur_value)
        console.log('saved_value', saved_value)
        if(cur_value == ''){
            $(this).closest('tr').find('.btn-success').addClass('disabled')
            cur_value = 0;
        }
        else{
            if(cur_value != saved_value){
                console.log('here')
                $(this).closest('tr').find('.btn-success').removeClass('disabled')
                if($('#pp_doc1_i').hasClass('is-invalid')){
                    $(this).closest('tr').find('.save-pp-1').addClass('disabled')
                    console.log('Roberto')
                }
            }
            else{
                console.log('here')
                $(this).closest('tr').find('.btn-success').addClass('disabled')
            }
        }
        if($(this).attr('type') == 'number'){
            if(parseFloat( thisHtml.val() ) > 9999.99){
                thisHtml.val( 9999.99 )
            }
            if(thisHtml.val().toString().split('.').length == 2){
                if(thisHtml.val().toString().split('.')[1].length > 2){
                    thisHtml.val( parseFloat(thisHtml.val()).toFixed(2) )
                }
                if(thisHtml.val().toString().split('.')[0].length > 2){
                    if(parseFloat( thisHtml.val() != 9999.99)){
                        thisHtml.val( parseFloat( thisHtml.val()).toFixed(6 - thisHtml.val().toString().split('.')[0].length) )
                    }
                }
            }
            if(cur_value.toString().split('.').length == 1){
                let val = (cur_value - 1).toString();
                if(cur_value.length > 6){
                    thisHtml.val( `${val[0]}${val[1]}${val[2]}${val[3]}${val[4]}${val[5]}` )
                }
            }
            if(cur_value <= 0.99){
                thisHtml.val('')
            }
        }
        if($(this).attr('type') == 'text'){
            if($(this).val() == '' || !$(this).val().trim().length){
                console.log('Empty string')
                $(this).closest('tr').find('.btn-success').addClass('disabled')
            }
            else{
                console.log('Not empty')
                $(this).closest('tr').find('.btn-success').removeClass('disabled')
                console.log($(this).closest('tr').find('.pp_fileInput').hasClass('is-invalid'))
                if( $(this).closest('tr').find('.pp_fileInput').hasClass('is-invalid')){
                    thisHtml.closest('tr').find('.btn-success').addClass('disabled')
                }
            }
        }
        console.log($(this).closest('table').attr('id'))
        if($(this).closest('table').attr('id') || $(this).closest('table').attr('id') == 'wholesale-table'){
            let missing = 0;
            $(this).closest('tr').find('input').each(function(){
                console.log($(this).val())
                if($(this).val() == '' || $(this).val().trim().length == 0){
                    if($(this).attr('type') != 'file'){
                        missing += 1;
                    }
                }
            })
            if(!missing){
                $(this).closest('tr').find('.btn-success').removeClass('disabled')
                if( $(this).closest('tr').find('.pp_fileInput').hasClass('is-invalid')){
                    thisHtml.closest('tr').find('.btn-success').addClass('disabled')
                }
            }
            else{
                $(this).closest('tr').find('.btn-success').addClass('disabled')
            }
        }
    })

    $('.product-rewards tbody').on('click', '.cancel-pp' , async function(){
        console.log('table cancel pssp')
        console.log( $(this).attr('id') )
        let data_id = $(this).attr('id').trim();
        let price_program = await axios.get('/api/price-program')
        if( $(this).closest('table').attr('id') == 'retail-table'){
            price_program.data = price_program.data[0];
        }
        else{
            price_program.data = price_program.data[1];
        }
        console.log(price_program.data)
        if(price_program.data){
            switch(data_id){
                case 'f2r':
                    if(price_program.data.second_row){
                        $(this).closest('tr').html(`<td>2</td>
                        <td class="f2r_percentage_label"></td>
                        <td class="f2r_percentage_value">${price_program.data.second_row.percentage_value}</td>
                        <td class="f2r_label">${price_program.data.second_row.label}</td>
                        <td class="f2r_carton_price">${price_program.data.second_row.carton_price}</td>
                        <td>
                          <button type="button" class="btn btn-secondary-round btn-edit-25" id="f2r">Edit</button>
                        </td>`)
                    }
                break;
                case 'f3r':
                    if(price_program.data.third_row){
                        $(this).closest('tr').html(`<td>3</td>
                        <td class="f3r_percentage_label"></td>
                        <td class="f3r_percentage_value">${price_program.data.third_row.percentage_value}</td>
                        <td class="f3r_label">${price_program.data.third_row.label}</td>
                        <td class="f3r_carton_price">${price_program.data.third_row.carton_price}</td>
                        <td>
                          <button type="button" class="btn btn-secondary-round btn-edit-25" id="f3r">Edit</button>
                        </td>`)
                    }
                break;
                case 'f4r':
                    if(price_program.data.fourth_row){
                        $(this).closest('tr').html(`<td>4</td>
                        <td class="f4r_percentage_label"></td>
                        <td class="f4r_percentage_value">${price_program.data.fourth_row.percentage_value}</td>
                        <td class="f4r_label">${price_program.data.fourth_row.label}</td>
                        <td class="f4r_carton_price">${price_program.data.fourth_row.carton_price}</td>
                        <td>
                          <button type="button" class="btn btn-secondary-round btn-edit-25" id="f4r">Edit</button>
                        </td>`)
                    }
                break;
                case 'f5r' : 
                    if(price_program.data.fifth_row){
                        $(this).closest('tr').html(`<td>5</td>
                        <td class="f5r_percentage_label"></td>
                        <td class="f5r_percentage_value">${price_program.data.fifth_row.percentage_value}</td>
                        <td class="f5r_label">${price_program.data.fifth_row.label}</td>
                        <td class="f5r_carton_price">${price_program.data.fifth_row.carton_price}</td>
                        <td>
                        <button type="button" class="btn btn-secondary-round btn-edit-25" id="f5r">Edit</button>
                        </td>`)
                    }
                break;
            }
        }
    })

    if(window.location.pathname == '/price-program'){
        let price_program = await axios.get('/api/price-program')
        let tableId;
        console.log(price_program.data)
        for(let i = 0; i < price_program.data.length; i++){
            if(price_program.data[i].type == 'RETAIL'){
                tableId = '#retail-table'
            }
            else{
                tableId = '#wholesale-table'
            }
            if(price_program.data){
                if(price_program.data[i].first_row){
                    if(price_program.data[i].first_row.image){
                        $(`${tableId} .pp_image`).attr('src', price_program.data[i].first_row.image)
                    }
                    if(price_program.data[i].first_row.label){
                        $(`${tableId} .f1r_label`).text(price_program.data[i].first_row.label)
                    }
                    if(price_program.data[i].first_row.carton_price){
                        $(`${tableId} .f1r_carton_price`).text(price_program.data[i].first_row.carton_price)
                    }
                }
                if(price_program.data[i].second_row){
                    if(price_program.data[i].second_row.percentage_value){
                        $(`${tableId} .f2r_percentage_value`).text(`${price_program.data[i].second_row.percentage_value}`)
                    }
                    // if(price_program.data[i].second_row.percentage_label){
                    //     $(`${tableId} .f2r_percentage_label`).text(`${price_program.data[i].second_row.percentage_label}`)
                    // }
                    if(price_program.data[i].second_row.label){
                        $(`${tableId} .f2r_label`).text(price_program.data[i].second_row.label)
                    }
                    if(price_program.data[i].second_row.carton_price){
                        $(`${tableId} .f2r_carton_price`).text(price_program.data[i].second_row.carton_price)
                    }
                }
                if(price_program.data[i].third_row){
                    if(price_program.data[i].third_row.percentage_value){
                        $(`${tableId} .f3r_percentage_value`).text(`${price_program.data[i].third_row.percentage_value}`)
                    }
                    // if(price_program.data[i].third_row.percentage_label){
                    //     $(`${tableId} .f3r_percentage_label`).text(`${price_program.data[i].third_row.percentage_label}`)
                    // }
                    if(price_program.data[i].third_row.label){
                        $(`${tableId} .f3r_label`).text(price_program.data[i].third_row.label)
                    }
                    if(price_program.data[i].third_row.carton_price){
                        $(`${tableId} .f3r_carton_price`).text(price_program.data[i].third_row.carton_price)
                    }
                }
                if(price_program.data[i].fourth_row){
                    if(price_program.data[i].fourth_row.percentage_value){
                        $(`${tableId} .f4r_percentage_value`).text(`${price_program.data[i].fourth_row.percentage_value}`)
                    }
                    // if(price_program.data[i].fourth_row.percentage_label){
                    //     $(`${tableId} .f4r_percentage_label`).text(`${price_program.data[i].fourth_row.percentage_label}`)
                    // }
                    if(price_program.data[i].fourth_row.label){
                        $(`${tableId} .f4r_label`).text(price_program.data[i].fourth_row.label)
                    }
                    if(price_program.data[i].fourth_row.carton_price){
                        $(`${tableId} .f4r_carton_price`).text(price_program.data[i].fourth_row.carton_price)
                    }
                }
                if(price_program.data[i].fifth_row){
                    if(price_program.data[i].fifth_row.percentage_value){
                        $(`${tableId} .f5r_percentage_value`).text(`${price_program.data[i].fifth_row.percentage_value}`)
                    }
                    // if(price_program.data[i].fifth_row.percentage_label){
                    //     $(`${tableId} .f5r_percentage_label`).text(`${price_program.data[i].fifth_row.percentage_label}`)
                    // }
                    if(price_program.data[i].fifth_row.label){
                        $(`${tableId} .f5r_label`).text(price_program.data[i].fifth_row.label)
                    }
                    if(price_program.data[i].fifth_row.carton_price){
                        $(`${tableId} .f5r_carton_price`).text(price_program.data[i].fifth_row.carton_price)
                    }
                }
                if(price_program.data[i].sixth_row){
                    $(`${tableId} .f6r_label`).text(price_program.data[i].sixth_row.label)
                }
                if(price_program.data[i].is_shown == 1){
                    $('.dynamic-content').html(`<div class="col-md-6 page-priceprogram--display">
                    <img src="image/screen-priceprogram.jpg" class="rounded" alt="...">
                    <button class="btn btn-primary-round btn-block pp-show-hide-screen">Hide Price Program (Mechanics & Rewards)</button>
                    </div>`)
                }
                else{
                    $('.dynamic-content').html(`<div class="col-md-6 page-priceprogram--display">
                    <img src="image/screen-priceprogram-hide.jpg" class="rounded" alt="...">
                    <button class="btn btn-success-round btn-block pp-show-hide-screen">Show Price Program (Mechanics & Rewards)</button>
                    </div> `)
                }
            }
        }
    }

    $('.product-rewards tbody').on('click', '.btn-edit-6' , async function(){
        console.log('btn-edit-6')
        let price_program = await axios.get('/api/price-program')
        if( $(this).closest('table').attr('id') == 'retail-table'){
            price_program.data = price_program.data[0];
        }
        else{
            price_program.data = price_program.data[1];
        }
        $(this).closest('tr').html(`<td>6</td>
        <td></td>
        <td></td>
        <td><input type="text" maxlength="30" class="form-control form-enable" value="${price_program.data.sixth_row.label}" id="${price_program.data.sixth_row.label}" required></td>
        <td></td>
        <td>
          <div class="btn-group" role="group" aria-label="Basic example">
             <button type="button" class="btn btn-secondary cancel-pp-6" id="f6r">Cancel</button>
             <a class="btn btn-success save-pp-6 disabled" id="f6r">Save</a>
          </div>
        </td>`)
    })

    $('.product-rewards tbody').on('click', '.cancel-pp-6' , async function(){
        console.log('cancel-pp-6')
        let price_program = await axios.get('/api/price-program')
        if( $(this).closest('table').attr('id') == 'retail-table'){
            price_program.data = price_program.data[0];
        }
        else{
            price_program.data = price_program.data[1];
        }
        $(this).closest('tr').html(`<td>6</td>
        <td></td>
        <td></td>
        <td class="f6r_label">${price_program.data.sixth_row.label}</td>
        <td></td>
        <td>
          <button type="button" class="btn btn-secondary-round btn-edit-6">Edit</button>
        </td>`)
    })

    $('.product-rewards tbody').on('click', '.save-pp-6' , async function(){
        $('#updatepriceprogram').modal('show')
        console.log('table save pssp')
        let id = 'f6r'
        let data = [];
        let tableId = $(this).closest('table').attr('id') 
        $(this).closest('tr').find("input").each(function() {
            data.push(this.value)
        });
        let params = {}
        params.data = {
            label : data[0].trim(),
        }
        params.row = id
        params.table = tableId
        console.log('params', params)
        let updateRes = await axios.patch('/api/update-price-program', params)
        if(updateRes.data.payload == 'updated'){
            console.log('Success')
            setTimeout(function(){
                $('#updatepriceprogram').modal('hide')
                $('#success_pp').css('display', '')
                $(`#${tableId} .cancel-pp-6#${id}`).trigger('click')
            }, 1000);
        }
        else{
            console.log('Internal server error')
            $('#updatepriceprogram').modal('hide')
        }
    })

    $('.product-rewards tbody').on('click', '.save-pp' , async function(){
        $('#updatepriceprogram').modal('show')
        console.log('table save pssp')
        let id = $(this).attr('id').trim()
        let data = [];
        let tableId = $(this).closest('table').attr('id') 
        $(this).closest('tr').find("input").each(function() {
            data.push(this.value)
        });
        let params = {}
        params.data = {
            percentage_value : parseFloat(data[0]),
            label : data[1].trim(),
            carton_price : parseFloat(data[2]),
            // percentage_label : data[0]
        }
        params.row = id
        params.table = tableId
        params.data.percentage_value = ((isNaN(params.data.percentage_value)) ? 0 : params.data.percentage_value);
        params.data.carton_price = ((isNaN(params.data.carton_price)) ? 0 : params.data.carton_price);
        console.log('params', params)
        let updateRes = await axios.patch('/api/update-price-program', params)
        if(updateRes.data.payload == 'updated'){
            console.log('Success')
            setTimeout(function(){
                $('#updatepriceprogram').modal('hide')
                $('#success_pp').css('display', '')
                console.log(`#${tableId} #${id}`)
                $(`#${tableId} .cancel-pp#${id}`).trigger('click')
            }, 1000);
        }
        else{
            console.log('Internal server error')
            $('#updatepriceprogram').modal('hide')
        }
    })

    $('.product-rewards tbody').on('click', '.btn-edit-1' ,async function(){
        console.log('btn-edit-1')
        let filename;
        let price_program = await axios.get('/api/price-program')
        console.log(price_program.data)
        if( $(this).closest('table').attr('id') == 'retail-table'){
            price_program.data = price_program.data[0];
        }
        else{
            price_program.data = price_program.data[1];
        }
        if(price_program.data.first_row.image){
            filename = price_program.data.first_row.image.split('/')[4].split('_')[0]
        }
        else{
            filename = 'Choose file'
        }
        $(this).closest('tr').html(`<td>1</td>
        <td colspan="2">
          <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text" id="inputGroupFileAddon01">Upload Image</span>
              </div>

              <div class="custom-file">
                <input type="file" class="custom-file-input pp_fileInput" id="${price_program.data.id}_i" accept="image/jpg, image/png">
                <label class="custom-file-label" style="text-overflow: ellipsis;display: inline-block;width: 100%;white-space: nowrap;overflow: hidden;" for="inputGroupFile01">${filename}</label>
              </div>
            </div>
            <div class="row programs--badge">
            <div class="col-md-12" id="${price_program.data.id}file_error">
                <span class="badge badge-danger">File Format: PNG or JPG | File size: Max of 5 MB</span>
            </div>
        </div>
        </td>
        <td><input type="text" maxlength="20" class="form-control form-enable" value="${price_program.data.first_row.label}" id="${price_program.data.first_row.label}" required></td>
        <td><input type="number" class="form-control form-enable" value="${price_program.data.first_row.carton_price}" id="${price_program.data.first_row.carton_price}" min="1" required oninput="this.value = Math.abs(this.value);if(this.value == 0){this.value = ''};if(this.value <= 0.99){this.value = ''}"></td>
        <td>
           <div class="btn-group" role="group" aria-label="Basic example">
              <button type="button" class="btn btn-secondary cancel-pp-1" id="f1r">Cancel</button>
              <a class="btn btn-success save-pp-1 disabled">Save</a>
          </div>
        </td>`)
        
    })

    $('.product-rewards tbody').on('click', '.cancel-pp-1' , async function(){
        console.log('table cancel pssp')
        let price_program = await axios.get('/api/price-program')
        if( $(this).closest('table').attr('id') == 'retail-table'){
            price_program.data = price_program.data[0];
        }
        else{
            price_program.data = price_program.data[1];
        }
        $(this).closest('tr').html(`<td>1</td>
        <td colspan="2"><img class="pp_image" src="${price_program.data.first_row.image}" style="width: 40px"></td>
        <td class="f1r_label">${price_program.data.first_row.label}</td>
        <td class="f1r_carton_price">${price_program.data.first_row.carton_price}</td>
        <td>
          <button type="button" class="btn btn-secondary-round btn-edit-1">Edit</button>
        </td>`)
        
    })

    $('.product-rewards tbody').on('change', '.pp_fileInput', function(){
        $(this).nextAll('.custom-file-label').html($(this)[0].files[0].name)  
        $(this).closest('tr').find('.save-pp-1').removeClass('disabled')    
        $(this).removeClass('is-invalid')
        var files = $(this)[0].files[0]
        var filesize = ((files.size/1024)/1024).toFixed(4);
        console.log(files.type)
        if(filesize >  5){
            console.log(files.type)
            $(this).addClass('is-invalid')
            $(this).closest('tr').find('.save-pp-1').addClass('disabled') 
        }
        if(files.type != 'image/jpeg' && files.type != 'image/png'){
            console.log(files.type)
            $(this).addClass('is-invalid')
            $(this).closest('tr').find('.save-pp-1').addClass('disabled') 
        }
        // $(this).closest('tr').find('input').trigger('keyup')
    })

    $('.product-rewards tbody').on('click', '.save-pp-1' , async function(){
        $('#updatepriceprogram').modal('show')
        let image_url;
        console.log('table save pssp')
        let id = 'f1r'
        let data = [];
        let tableId = $(this).closest('table').attr('id') 
        $(this).closest('tr').find("input").each(function() {
            data.push(this.value)
        });
        console.log('data', data)
        let params = {}
        params.data = {
            label : data[1].trim(),
            carton_price : parseFloat(data[2]),
        }
        params.row = id
        params.table = tableId
        const fileChooser = $(this).closest('tr').find("input[type=file]")
        const fileName = $(this).closest('tr').find("input[type=file]").val().split('\\')[2];
        if (fileChooser[0].files[0]) {
            console.log('If filechooser')
            const profilePicture = fileChooser[0].files[0];
            const objKey = `price-program/${fileName}_${moment().valueOf()}`;
            const params = {
            Key: objKey,
            ContentType: profilePicture.type,
            Body: profilePicture,
            };
            var sUrl = await s3(params);
            if(sUrl){
                image_url = sUrl;
            }
        }
        if(image_url){
            params.data.image = image_url;
        }
        params.data.carton_price = ((isNaN(params.data.carton_price)) ? 0 : params.data.carton_price);
        console.log('params', params)
        let updateRes = await axios.patch('/api/update-price-program', params)
        if(updateRes.data.payload == 'updated'){
            console.log('Success')
            setTimeout(function(){
                $('#updatepriceprogram').modal('hide')
                $('#success_pp').css('display', '')
                $(`#${tableId} .cancel-pp-1#${id}`).trigger('click')
            }, 1000);
        }
        else{
            console.log('Internal server error')
            $('#updatepriceprogram').modal('hide')
        }
    })

    $('.page-priceprogram--screen1').on('click','.pp-show-hide-screen', async function(){
        console.log( $(this).html().trim() )
        $(this).addClass('disabled')
        let params = {}
        if($(this).html().trim() == 'Show Price Program (Mechanics &amp; Rewards)'){
            params.data = 1
            params.row = ''
            let updateRes = await axios.patch('/api/update-price-program', params)
            if(updateRes.data.payload == 'updated'){
                $('.dynamic-content').html(`<div class="col-md-6 page-priceprogram--display">
                <img src="image/screen-priceprogram.jpg" class="rounded" alt="...">
                <button class="btn btn-primary-round btn-block pp-show-hide-screen">Hide Price Program (Mechanics & Rewards)</button>
                </div>`)
                $(this).removeClass('disabled')
                $('#success_pp').css('display', '')
                setTimeout(function(){
                    $('#success_pp').css('display', 'none')
                }, 180000);
            }
            else{
                console.log('Internal server error')
                $(this).removeClass('disabled')
            }
        }
        else{
            params.data = 0
            params.row = ''
            let updateRes = await axios.patch('/api/update-price-program', params)
            if(updateRes.data.payload == 'updated'){
                $('.dynamic-content').html(`<div class="col-md-6 page-priceprogram--display">
                <img src="image/screen-priceprogram-hide.jpg" class="rounded" alt="...">
                <button class="btn btn-success-round btn-block pp-show-hide-screen">Show Price Program (Mechanics & Rewards)</button>
                </div> `)
                $(this).removeClass('disabled')
                $('#success_pp').css('display', '')
                setTimeout(function(){
                    $('#success_pp').css('display', 'none')
                }, 180000);
            }
            else{
                console.log('Internal server error')
                $(this).removeClass('disabled')
            }
        }
    })

    $(".message-content").keydown(function(e){
        // Enter was pressed without shift key
        if ((e.keyCode == 13 && e.shiftKey) || (e.keyCode == 13 && !e.shiftKey))
        {
            // prevent default behavior
            e.preventDefault();
        }
        });

});
window.captionKeyup = async function(data){
    console.log('ASD', data)
    $(`#${data}_s`).text(`Character/s Remaining:  ${50 - $(`#${data}`).val().length}`)
    console.log('clicked', data);
    if($(`#${data}`).val() == '' || !$(`#${data}`).val().trim().length){
        $(`#${data}_s`).closest('tr').find('.tp_buttons').addClass('disabled')
        $(`#${data}`).addClass('is-invalid')
    }
    else{
        $(`#${data}`).removeClass('is-invalid')
        let res = await axios.post('/api/trade-programs', { id : data})
        if(res.data.payload.caption != $(`#${data}`).val()){
            $(`#${data}_s`).closest('tr').find('.tp_buttons').removeClass('disabled')
            if($(`#${data}_s`).closest('tr').find('.tp_fileInput').hasClass('is-invalid')){
                $(`#${data}_s`).closest('tr').find('.tp_buttons').addClass('disabled')
            }
        }
        else{
            $(`#${data}_s`).closest('tr').find('.tp_buttons').addClass('disabled')
        }
    }
}
window.contentKeyup = function(data){
    if($(`.${data}`).val().trim().length == 0 || $(`.${data}`).val() == ''){
        $('.update-message').addClass('disabled')
    }
    else{
        if($(`.${data}`).val() != $(`.${data}`).attr('id')){
            $(`.update-message`).removeClass('disabled')
        }
        else{
            $(`.update-message`).addClass('disabled')
        }
    }
    $(`.${data}_s`).text(`Character/s Remaining:  ${60 - $(`.${data}`).val().length}`)
}
window.psspInput = function(thisElement, data) {
    console.log(thisElement)
    console.log(parseInt( $(thisElement).val()))
    if(parseFloat( $(thisElement).val() ) > 9999.99){
            $(thisElement).val( 9999.99 )
    }
    if($(thisElement).val().toString().split('.').length == 2){
        if($(thisElement).val().toString().split('.')[1].length > 2){
            $(thisElement).val( parseFloat($(thisElement).val()).toFixed(2) )
        }
        if($(thisElement).val().toString().split('.')[0].length > 2){
            if(parseFloat( $(thisElement).val() != 9999.99)){
                $(thisElement).val( parseFloat( $(thisElement).val()).toFixed(6 - $(thisElement).val().toString().split('.')[0].length) )
            }
        }
    }
    if($(thisElement).val().toString().split('.').length == 1){
        let val = ($(thisElement).val() - 1).toString();
        console.log(val[0])
        if($(thisElement).val().length > 6){
            $(thisElement).val( `${val[0]}${val[1]}${val[2]}${val[3]}${val[4]}${val[5]}` )
        }
    }
    if($(thisElement).val() == ''){
        $(thisElement).closest('tr').find('.pssp_action_btn').addClass('disabled')
    }
    else{
        $(thisElement).closest('tr').find('.pssp_action_btn').removeClass('disabled')
        if($(thisElement).closest('tr').find('.pssp_file_input').hasClass('is-invalid')){
            $(thisElement).closest('tr').find('.pssp_action_btn').addClass('disabled')
        }
    }
    if($(thisElement).val() <= 0.99){
        $(thisElement).val('')
        $(thisElement).closest('tr').find('.pssp_action_btn').addClass('disabled')
    } 
}

