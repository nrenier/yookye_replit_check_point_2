import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "@/components/ui/logo";
import { Link, Redirect } from "wouter";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Inserisci il tuo username" }),
  password: z.string().min(1, { message: "Inserisci la tua password" }),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(8, { message: "La password deve contenere almeno 8 caratteri" }),
  acceptTerms: z.boolean().refine(val => val === true, { message: "Devi accettare i termini e le condizioni" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      acceptTerms: false,
    },
  });
  
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { acceptTerms, ...userData } = data;
    registerMutation.mutate(userData);
  };
  
  // Redirect to home if already logged in
  if (user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen bg-yookve-light flex flex-col">
      <header className="bg-black text-white py-4">
        <div className="container mx-auto px-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      
      <div className="flex-grow flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="font-montserrat font-bold text-3xl mb-6">Il tuo account Yookve</h2>
                
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Accedi</TabsTrigger>
                    <TabsTrigger value="register">Registrati</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Il tuo username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="La tua password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-yookve-red hover:bg-red-700"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Accedi
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome e Cognome</FormLabel>
                              <FormControl>
                                <Input placeholder="Il tuo nome e cognome" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="La tua email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Scegli uno username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Scegli una password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="acceptTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Accetto i termini e le condizioni
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-yookve-red hover:bg-red-700"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Registrati
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="md:w-1/2 bg-yookve-dark hidden md:block">
                <div 
                  className="w-full h-full object-cover bg-center bg-cover"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=1000&q=80')",
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center p-12 bg-black bg-opacity-40">
                    <div className="text-white max-w-md">
                      <h3 className="text-2xl font-bold mb-4">Il viaggio dei tuoi sogni ti aspetta</h3>
                      <p className="mb-6">Registrati per scoprire proposte di viaggio personalizzate in base alle tue preferenze e passioni.</p>
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <i className="fas fa-check-circle mr-2 text-yookve-red"></i>
                          Pacchetti personalizzati
                        </li>
                        <li className="flex items-center">
                          <i className="fas fa-check-circle mr-2 text-yookve-red"></i>
                          Esperienze uniche
                        </li>
                        <li className="flex items-center">
                          <i className="fas fa-check-circle mr-2 text-yookve-red"></i>
                          Assistenza dedicata
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-black text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} Yookve. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
