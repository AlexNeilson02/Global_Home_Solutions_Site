import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, User, Award, Clock, TrendingUp } from 'lucide-react';

interface SalespersonData {
  user: {
    fullName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
  };
  salesperson: {
    id: number;
    profileUrl: string;
    bio?: string;
    specialties: string[];
    certifications: string[];
    yearsExperience?: number;
    totalVisits: number;
    successfulConversions: number;
  };
}

export default function SalespersonProfile() {
  const { profileUrl } = useParams();
  const [data, setData] = useState<SalespersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileUrl) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/salesperson/${profileUrl}`);
        if (!response.ok) {
          throw new Error('Salesperson not found');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'This salesperson profile could not be found.'}
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, salesperson } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sales Representative Profile
          </h1>
          <p className="text-lg text-gray-600
            Global Home Solutions
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">{user.fullName}</CardTitle>
            <p className="text-muted-foreground">Sales Representative</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Experience & Stats */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Experience
                </h3>
                <div className="space-y-3">
                  {salesperson.yearsExperience && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{salesperson.yearsExperience} years of experience</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span>{salesperson.totalVisits} profile visits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {salesperson.bio && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-lg mb-3">About</h3>
                <p className="text-muted-foreground">{salesperson.bio}</p>
              </div>
            )}

            {/* Specialties */}
            {salesperson.specialties && salesperson.specialties.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-lg mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {salesperson.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {salesperson.certifications && salesperson.certifications.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {salesperson.certifications.map((cert, index) => (
                    <Badge key={index} variant="outline">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="mt-8 pt-6 border-t text-center">
              <h3 className="font-semibold text-lg mb-3">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-4">
                Contact me directly for your home improvement needs or browse our available contractors.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => window.location.href = '/'}>
                  View Contractors
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.location.href = `tel:${user.phone}`}>
                  Call Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}